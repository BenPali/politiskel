//! Shape checks on what a client may store.
//!
//! The server checks shape — types, ranges, size — not meaning: scoring runs
//! in the browser, which already ignores an answer outside its item's scale,
//! so a wrong value can only skew the profile of the account that sent it.

use serde_json::{Map, Value};

/// The sixteen PolitiScales poles, as tools/politi-model.js names them,
/// paired as each axis's two ends.
const PAIRS: [(&str, &str); 8] = [
    ("com", "cap"), ("reg", "laf"), ("eco", "prod"), ("cst", "ess"),
    ("rehab", "pun"), ("prg", "csv"), ("int", "nat"), ("rev", "ref"),
];

pub const MAX_ANSWERS: usize = 300;

/// A pseudonym: shown to every group its owner joins, so no e-mail, and a
/// short list of characters that cannot smuggle markup anywhere.
pub fn username(raw: &str) -> Result<String, &'static str> {
    let name = raw.trim();
    let len = name.chars().count();
    if !(2..=24).contains(&len) {
        return Err("username_length");
    }
    if !name.chars().all(|c| c.is_alphanumeric() || " -_.'".contains(c)) {
        return Err("username_chars");
    }
    Ok(name.to_string())
}

pub fn password(raw: &str) -> Result<(), &'static str> {
    let len = raw.chars().count();
    if len < 10 {
        return Err("password_short");
    }
    if len > 256 {
        return Err("password_long");
    }
    Ok(())
}

pub fn group_name(raw: &str) -> Result<String, &'static str> {
    let name = raw.trim();
    if !(1..=60).contains(&name.chars().count()) {
        return Err("group_name_length");
    }
    Ok(name.to_string())
}

/// PolitiScales percentages: known poles only, each within 0-100, and the two
/// ends of an axis at most 100 together, as on a PolitiScales result.
pub fn politiscales(v: &Value) -> Result<(), &'static str> {
    let obj = v.as_object().ok_or("politiscales_not_object")?;
    let known = |k: &str| PAIRS.iter().any(|(a, b)| *a == k || *b == k);
    for (k, x) in obj {
        if !known(k) {
            return Err("politiscales_unknown_pole");
        }
        let n = x.as_f64().ok_or("politiscales_not_number")?;
        if !(0.0..=100.0).contains(&n) {
            return Err("politiscales_out_of_range");
        }
    }
    let get = |k: &str| obj.get(k).and_then(Value::as_f64).unwrap_or(0.0);
    if PAIRS.iter().any(|(a, b)| get(a) + get(b) > 100.5) {
        return Err("politiscales_over_hundred");
    }
    Ok(())
}

/// Questionnaire answers: item or salience keys mapped to an option index or
/// "dk" ("can't choose").
pub fn answers(v: &Value) -> Result<(), &'static str> {
    let obj: &Map<String, Value> = v.as_object().ok_or("answers_not_object")?;
    if obj.len() > MAX_ANSWERS {
        return Err("answers_too_many");
    }
    for (k, x) in obj {
        let key_ok = (1..=64).contains(&k.len())
            && k.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || "._-".contains(c));
        if !key_ok {
            return Err("answers_bad_key");
        }
        let value_ok = match x {
            Value::String(s) => s == "dk",
            Value::Number(n) => n.as_u64().is_some_and(|i| i <= 20),
            _ => false,
        };
        if !value_ok {
            return Err("answers_bad_value");
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn usernames() {
        assert_eq!(username("  Zoé "), Ok("Zoé".into()));
        assert!(username("a").is_err());
        assert!(username("<script>").is_err());
        assert!(username(&"x".repeat(25)).is_err());
    }

    #[test]
    fn politiscales_shapes() {
        assert!(politiscales(&json!({"com": 60, "cap": 30})).is_ok());
        assert!(politiscales(&json!({"com": 70, "cap": 40})).is_err());
        assert!(politiscales(&json!({"com": 101})).is_err());
        assert!(politiscales(&json!({"nope": 1})).is_err());
        assert!(politiscales(&json!([1, 2])).is_err());
    }

    #[test]
    fn answer_shapes() {
        assert!(answers(&json!({"ess.gincdif": 0, "salience.economy": 3, "issp.obey": "dk"})).is_ok());
        assert!(answers(&json!({"ess.gincdif": 21})).is_err());
        assert!(answers(&json!({"ess.gincdif": -1})).is_err());
        assert!(answers(&json!({"ess.gincdif": "maybe"})).is_err());
        assert!(answers(&json!({"<b>": 1})).is_err());
    }
}
