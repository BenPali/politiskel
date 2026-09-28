//! The model check: how the scoring behaves on real answers, from the members
//! who agreed to it (users.model_check), for the admins named in
//! POLITISKEL_ADMINS.
//!
//! Answers never leave the server for it. The scoring is done here, from the
//! model the site was built with (site/build/model.json, exported from
//! tools/politi-quiz.js), and only aggregates come out: nothing at all below
//! MIN_PROFILES profiles, no figure resting on fewer than MIN_CELL, no row per
//! person, no name. What it measures, per axis:
//!   - how far the questionnaire moves a profile from its PolitiScales
//!     position, overall and for the left, the centre and the right: a
//!     consensual item pulls one side more than the other
//!   - each item against the rest of its axis: one that runs the other way
//!   - each sub-dimension against the others
//!   - a tendency to agree, whatever is asked, and whether it moves the axes.

use std::collections::HashMap;

use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use axum_extra::extract::cookie::CookieJar;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::auth::current_user;
use crate::error::{ApiError, ApiResult};
use crate::state::AppState;

/// Below this many profiles, nothing is reported but the count.
pub(crate) const MIN_PROFILES: usize = 30;
/// The fewest profiles any single figure may rest on.
const MIN_CELL: usize = 10;
/// A tendency to agree is only read on this many agree-type answers or more.
const MIN_AGREE_ANSWERS: usize = 6;

#[derive(Deserialize)]
pub(crate) struct Model {
    min_per_dim: usize,
    axes: Vec<PsAxis>,
    scales: HashMap<String, Scale>,
    themes: Vec<Theme>,
    items: Vec<Item>,
}
#[derive(Deserialize)]
struct PsAxis { neg: String, pos: String, axis: String, w: f64 }
#[derive(Deserialize)]
struct Scale { values: Vec<f64>, #[serde(default)] dk_scores: Option<f64>, #[serde(default)] agree: bool }
#[derive(Deserialize)]
struct Theme { key: String, reading: String, dims: Vec<String> }
#[derive(Deserialize)]
struct Item { id: String, theme: String, reading: String, dim: Option<String>, scale: String, pole: f64, asked: bool }

/// JavaScript's Math.round, which rounds halves up (−2.5 → −2): the site's
/// scores are rounded that way, and these must be the same numbers.
fn js_round(v: f64) -> f64 { (v + 0.5).floor() }

fn mean(vs: &[f64]) -> Option<f64> {
    if vs.is_empty() { None } else { Some(vs.iter().sum::<f64>() / vs.len() as f64) }
}

impl Model {
    /// The PolitiScales position on one axis, as tools/politi-model.js has it;
    /// None when the profile has no PolitiScales result at all.
    fn ps(&self, ps: &Value, which: &str) -> Option<f64> {
        let obj = ps.as_object()?;
        let get = |k: &str| obj.get(k).and_then(Value::as_f64);
        if !self.axes.iter().any(|a| get(&a.neg).is_some() || get(&a.pos).is_some()) {
            return None;
        }
        let (mut sum, mut weight) = (0.0, 0.0);
        for a in self.axes.iter().filter(|a| a.axis == which) {
            let (lo, hi) = (get(&a.neg), get(&a.pos));
            if lo.is_none() && hi.is_none() { continue; }
            sum += a.w * (hi.unwrap_or(0.0) - lo.unwrap_or(0.0));
            weight += a.w;
        }
        Some(if weight == 0.0 { 0.0 } else { js_round((sum / weight).clamp(-100.0, 100.0)) })
    }

    /// One answer, oriented: +1 right on x, TAN on y; None when skipped.
    fn value(&self, item: &Item, answer: &Value) -> Option<f64> {
        let scale = self.scales.get(&item.scale)?;
        if answer.as_str() == Some("dk") { return scale.dk_scores; }
        let k = answer.as_u64()? as usize;
        scale.values.get(k).map(|v| item.pole * v)
    }

    /// The raw answer, before orientation, on a scale whose first option is
    /// agreeing: +1 is agreeing fully.
    fn agreement(&self, item: &Item, answer: &Value) -> Option<f64> {
        let scale = self.scales.get(&item.scale)?;
        if !scale.agree { return None; }
        scale.values.get(answer.as_u64()? as usize).copied()
    }

    /// A theme's main reading, as tools/politi-quiz.js scores it: the mean of
    /// its sub-dimensions, and nothing until each has `min_per_dim` answers.
    fn reading(&self, answers: &Value, theme_key: &str) -> Option<f64> {
        let theme = self.themes.iter().find(|t| t.key == theme_key)?;
        let mut dims = Vec::new();
        let mut missing = 0;
        for d in &theme.dims {
            let vs: Vec<f64> = self.items.iter()
                .filter(|i| i.asked && i.theme == theme.key && i.reading == theme.reading && i.dim.as_deref() == Some(d))
                .filter_map(|i| answers.get(&i.id).and_then(|a| self.value(i, a)))
                .collect();
            missing += self.min_per_dim.saturating_sub(vs.len());
            if let Some(m) = mean(&vs) { dims.push(js_round(100.0 * m)); }
        }
        if missing > 0 { return None; }
        mean(&dims).map(js_round)
    }
}

/// One profile, reduced to what the aggregates need.
struct Row {
    ps: [Option<f64>; 2],
    quiz: [Option<f64>; 2],
    /// oriented answers to the asked items of x (0) and y (1), by item index
    items: [Vec<(usize, f64)>; 2],
    /// sub-dimension means of x and y, by name
    dims: [HashMap<String, f64>; 2],
    agree: Option<f64>,
}

const AXES: [(&str, &str); 2] = [("x", "economy"), ("y", "society")];

fn row(model: &Model, ps: &Value, answers: &Value) -> Row {
    let mut r = Row { ps: [None, None], quiz: [None, None], items: [vec![], vec![]],
                      dims: [HashMap::new(), HashMap::new()], agree: None };
    for (a, (axis, theme)) in AXES.iter().enumerate() {
        r.ps[a] = model.ps(ps, axis);
        r.quiz[a] = model.reading(answers, theme);
        let mut by_dim: HashMap<String, Vec<f64>> = HashMap::new();
        for (k, it) in model.items.iter().enumerate() {
            if !it.asked || it.theme != *theme || it.reading != *axis { continue; }
            if let Some(v) = answers.get(&it.id).and_then(|x| model.value(it, x)) {
                r.items[a].push((k, v));
                if let Some(d) = &it.dim { by_dim.entry(d.clone()).or_default().push(v); }
            }
        }
        r.dims[a] = by_dim.into_iter().filter_map(|(d, vs)| mean(&vs).map(|m| (d, 100.0 * m))).collect();
    }
    let agreeing: Vec<f64> = model.items.iter().filter(|i| i.asked)
        .filter_map(|i| answers.get(&i.id).and_then(|x| model.agreement(i, x))).collect();
    if agreeing.len() >= MIN_AGREE_ANSWERS { r.agree = mean(&agreeing).map(|m| 100.0 * m); }
    r
}

fn median(vs: &mut [f64]) -> Option<f64> {
    if vs.is_empty() { return None; }
    vs.sort_by(|a, b| a.total_cmp(b));
    Some(vs[vs.len() / 2])
}
fn quantile(vs: &mut [f64], q: f64) -> Option<f64> {
    if vs.is_empty() { return None; }
    vs.sort_by(|a, b| a.total_cmp(b));
    Some(vs[((vs.len() as f64 * q) as usize).min(vs.len() - 1)])
}
/// Pearson's r and the least-squares slope of y on x.
fn fit(pairs: &[(f64, f64)]) -> Option<(f64, f64)> {
    let n = pairs.len() as f64;
    if pairs.len() < 3 { return None; }
    let (mx, my) = (pairs.iter().map(|p| p.0).sum::<f64>() / n, pairs.iter().map(|p| p.1).sum::<f64>() / n);
    let (mut sxy, mut sxx, mut syy) = (0.0, 0.0, 0.0);
    for (x, y) in pairs { sxy += (x - mx) * (y - my); sxx += (x - mx).powi(2); syy += (y - my).powi(2); }
    if sxx == 0.0 || syy == 0.0 { return None; }
    Some((sxy / (sxx * syy).sqrt(), sxy / sxx))
}
fn r2(v: f64) -> f64 { (v * 100.0).round() / 100.0 }
fn r0(v: f64) -> f64 { v.round() }

/// The aggregates, from the profiles that agreed. Pure, so it can be tested.
pub(crate) fn aggregate(model: &Model, profiles: &[(Value, Value)]) -> Value {
    let rows: Vec<Row> = profiles.iter().map(|(ps, a)| row(model, ps, a)).collect();
    let answering = rows.iter().filter(|r| r.items.iter().any(|v| !v.is_empty()) || r.agree.is_some()).count();
    if answering < MIN_PROFILES {
        return json!({ "ready": false, "profiles": answering, "min_profiles": MIN_PROFILES });
    }
    let mut axes = serde_json::Map::new();
    for (a, (axis, theme)) in AXES.iter().enumerate() {
        let placed = rows.iter().filter(|r| r.quiz[a].is_some()).count();
        let both: Vec<(f64, f64)> = rows.iter().filter_map(|r| Some((r.ps[a]?, r.quiz[a]?))).collect();
        let mut shift = serde_json::Map::new();
        if both.len() >= MIN_CELL {
            let mut d: Vec<f64> = both.iter().map(|(p, q)| q - p).collect();
            let mut abs: Vec<f64> = d.iter().map(|v| v.abs()).collect();
            let (r, slope) = fit(&both).unwrap_or((f64::NAN, f64::NAN));
            let band = |lo: f64, hi: f64| {
                let mut v: Vec<f64> = both.iter().filter(|(p, _)| *p >= lo && *p < hi).map(|(p, q)| q - p).collect();
                if v.len() >= MIN_CELL { json!({ "profiles": v.len(), "median": median(&mut v).map(r0) }) }
                else { json!({ "profiles": null, "median": null }) }
            };
            shift.insert("profiles".into(), json!(both.len()));
            shift.insert("mean".into(), json!(r0(mean(&d).unwrap_or(0.0))));
            shift.insert("median".into(), json!(median(&mut d).map(r0)));
            shift.insert("median_abs".into(), json!(median(&mut abs).map(r0)));
            shift.insert("p90_abs".into(), json!(quantile(&mut abs, 0.9).map(r0)));
            shift.insert("r".into(), json!(if r.is_nan() { None } else { Some(r2(r)) }));
            shift.insert("slope".into(), json!(if slope.is_nan() { None } else { Some(r2(slope)) }));
            shift.insert("bands".into(), json!({
                "neg": band(-101.0, -30.0), "mid": band(-30.0, 30.0 + f64::EPSILON), "pos": band(30.0 + f64::EPSILON, 101.0)
            }));
        }
        /* each item against the mean of the other items of its axis */
        let mut items = Vec::new();
        for (k, it) in model.items.iter().enumerate() {
            if !it.asked || it.theme != *theme || it.reading != *axis { continue; }
            let pairs: Vec<(f64, f64)> = rows.iter().filter_map(|r| {
                let own = r.items[a].iter().find(|(i, _)| *i == k)?.1;
                let rest: Vec<f64> = r.items[a].iter().filter(|(i, _)| *i != k).map(|p| p.1).collect();
                if rest.len() < 2 { return None; }
                Some((own, mean(&rest)?))
            }).collect();
            if pairs.len() < MIN_PROFILES { continue; }
            let m = pairs.iter().map(|p| p.0).sum::<f64>() / pairs.len() as f64;
            items.push(json!({ "id": it.id, "dim": it.dim, "profiles": pairs.len(),
                               "mean": r0(100.0 * m), "r_rest": fit(&pairs).map(|f| r2(f.0)) }));
        }
        items.sort_by(|p, q| p["r_rest"].as_f64().unwrap_or(9.0).total_cmp(&q["r_rest"].as_f64().unwrap_or(9.0)));
        /* each sub-dimension against the mean of the others */
        let theme_dims = model.themes.iter().find(|t| t.key == *theme).map(|t| t.dims.clone()).unwrap_or_default();
        let dims: Vec<Value> = theme_dims.iter().filter_map(|d| {
            let pairs: Vec<(f64, f64)> = rows.iter().filter_map(|r| {
                let own = *r.dims[a].get(d)?;
                let rest: Vec<f64> = r.dims[a].iter().filter(|(o, _)| *o != d).map(|p| *p.1).collect();
                Some((own, mean(&rest)?))
            }).collect();
            (pairs.len() >= MIN_PROFILES).then(|| json!({ "dim": d, "profiles": pairs.len(), "r_rest": fit(&pairs).map(|f| r2(f.0)) }))
        }).collect();
        axes.insert(axis.to_string(), json!({ "placed": placed, "shift": shift, "items": items, "dims": dims }));
    }
    /* a tendency to agree, and whether it goes with a move on either axis */
    let agree: Vec<&Row> = rows.iter().filter(|r| r.agree.is_some()).collect();
    let tendency = if agree.len() >= MIN_PROFILES {
        let mut vs: Vec<f64> = agree.iter().map(|r| r.agree.unwrap()).collect();
        let m = mean(&vs).unwrap_or(0.0);
        let sd = (vs.iter().map(|v| (v - m).powi(2)).sum::<f64>() / vs.len() as f64).sqrt();
        let with = |a: usize| {
            let pairs: Vec<(f64, f64)> = agree.iter().filter_map(|r| Some((r.agree?, r.quiz[a]? - r.ps[a]?))).collect();
            if pairs.len() >= MIN_PROFILES { fit(&pairs).map(|f| r2(f.0)) } else { None }
        };
        json!({ "profiles": agree.len(), "mean": r0(m), "median": median(&mut vs).map(r0), "sd": r0(sd),
                "r_shift_x": with(0), "r_shift_y": with(1) })
    } else { json!({ "profiles": agree.len() }) };
    json!({ "ready": true, "profiles": answering, "min_profiles": MIN_PROFILES, "min_cell": MIN_CELL,
            "axes": axes, "agree": tendency })
}

/// GET /api/admin/model-check
pub(crate) async fn report(State(state): State<AppState>, jar: CookieJar) -> ApiResult<Json<Value>> {
    let (_, name) = current_user(&state, &jar).await?;
    if !state.is_admin(&name) {
        return Err(ApiError(StatusCode::FORBIDDEN, "not_admin"));
    }
    let text = std::fs::read_to_string(state.site_dir.join("model.json"))
        .map_err(|_| ApiError(StatusCode::SERVICE_UNAVAILABLE, "no_model"))?;
    let model: Model = serde_json::from_str(&text).map_err(|e| {
        eprintln!("model.json: {e}");
        ApiError(StatusCode::SERVICE_UNAVAILABLE, "no_model")
    })?;
    let rows: Vec<(Option<String>, String)> = sqlx::query_as(
        "SELECT p.politiscales, p.answers FROM profiles p JOIN users u ON u.id = p.user_id WHERE u.model_check = 1")
        .fetch_all(&state.db).await?;
    let profiles: Vec<(Value, Value)> = rows.into_iter()
        .map(|(ps, a)| (crate::parse_json(ps), crate::parse_json(Some(a)))).collect();
    let consenting = profiles.len();
    let mut out = aggregate(&model, &profiles);
    out["consenting"] = json!(consenting);
    Ok(Json(out))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Synthetic profiles scored by tools/politi-quiz.js and politi-model.js
    /// (tools/export-model.js --fixture): the same numbers here, or the check
    /// measures a model the site does not use.
    #[test]
    fn scores_like_the_site() {
        let fixture: Value = serde_json::from_str(include_str!("../tests/fixtures/scoring.json")).unwrap();
        let model: Model = serde_json::from_value(fixture["model"].clone()).unwrap();
        let profiles = fixture["profiles"].as_array().unwrap();
        assert!(profiles.len() >= 50);
        let mut placed = 0;
        for (n, p) in profiles.iter().enumerate() {
            let e = &p["expect"];
            let ps = &p["politiscales"];
            assert_eq!(model.ps(ps, "x"), e["ps_x"].as_f64(), "profile {n}: PolitiScales x");
            assert_eq!(model.ps(ps, "y"), e["ps_y"].as_f64(), "profile {n}: PolitiScales y");
            assert_eq!(model.reading(&p["answers"], "economy"), e["x"].as_f64(), "profile {n}: x");
            assert_eq!(model.reading(&p["answers"], "society"), e["y"].as_f64(), "profile {n}: y");
            assert_eq!(model.reading(&p["answers"], "europe"), e["europe"].as_f64(), "profile {n}: europe");
            if e["x"].is_number() { placed += 1; }
        }
        assert!(placed > 10, "the fixture should place some profiles, not only test the null case");
    }

    #[test]
    fn says_nothing_below_the_minimum() {
        let fixture: Value = serde_json::from_str(include_str!("../tests/fixtures/scoring.json")).unwrap();
        let model: Model = serde_json::from_value(fixture["model"].clone()).unwrap();
        let few: Vec<(Value, Value)> = fixture["profiles"].as_array().unwrap().iter().take(MIN_PROFILES - 1)
            .map(|p| (p["politiscales"].clone(), p["answers"].clone())).collect();
        let out = aggregate(&model, &few);
        assert_eq!(out["ready"], json!(false));
        assert!(out.get("axes").is_none());
        let all: Vec<(Value, Value)> = fixture["profiles"].as_array().unwrap().iter()
            .map(|p| (p["politiscales"].clone(), p["answers"].clone())).collect();
        let out = aggregate(&model, &all);
        assert_eq!(out["ready"], json!(true));
        /* aggregates only: no per-profile value anywhere in the answer */
        let text = out.to_string();
        assert!(!text.contains("answers") && !text.contains("politiscales"));
    }

    #[test]
    fn rounds_halves_like_javascript() {
        assert_eq!(js_round(-2.5), -2.0);
        assert_eq!(js_round(2.5), 3.0);
        assert_eq!(js_round(-2.6), -3.0);
    }
}
