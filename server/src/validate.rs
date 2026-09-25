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
///
/// Latin letters only, with their accents. Accepting any Unicode letter let a
/// Cyrillic "а" pass for a Latin "a", and a decomposed "é" for a composed one.
/// The name is stored composed (NFC) with single spaces — HTML collapses runs
/// of them anyway — and compared through `username_key`, which folds the
/// common look-alikes. That narrows impersonation; it cannot rule out every
/// resemblance a typeface allows.
pub fn username(raw: &str) -> Result<String, &'static str> {
    use unicode_normalization::UnicodeNormalization;
    let name: String = raw.split_whitespace().collect::<Vec<_>>().join(" ").nfc().collect();
    let len = name.chars().count();
    if !(2..=24).contains(&len) {
        return Err("username_length");
    }
    let latin = |c: char| c.is_ascii_alphanumeric()
        || (('\u{00C0}'..='\u{017F}').contains(&c) && c != '\u{00D7}' && c != '\u{00F7}');
    if !name.chars().all(|c| latin(c) || " -_.'".contains(c)) {
        return Err("username_chars");
    }
    Ok(name)
}

/// The key two names collide on: accents stripped, case folded, letters that
/// do not decompose (ı, ł, ø, đ…) mapped to their base, the glyphs a
/// sans-serif face draws alike (l, I and 1; O and 0) merged, and spaces and
/// punctuation dropped. "Zoé", "ZOÉ", "Zoe", "Adrıen" / "Adrien", "AIice" /
/// "Alice" and "Jean-Paul" / "Jean Paul" each share one, so only one of each
/// pair can exist.
pub fn username_key(name: &str) -> String {
    use unicode_normalization::{char::is_combining_mark, UnicodeNormalization};
    let mut out = String::new();
    for c in name.nfkd().filter(|c| !is_combining_mark(*c)).flat_map(char::to_lowercase) {
        let folded: &str = match c {
            'ı' | 'l' | '1' | 'ŀ' | 'ł' => "i",
            '0' | 'ø' => "o",
            'đ' | 'ð' => "d",
            'ħ' => "h",
            'ŧ' => "t",
            'ĸ' => "k",
            'ß' => "ss",
            'æ' => "ae",
            'œ' => "oe",
            'þ' => "th",
            c if c.is_alphanumeric() => { out.push(c); continue; }
            _ => continue,                       // spaces, - _ . '
        };
        out.push_str(folded);
    }
    out
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

/// The flag PolitiScales draws, cropped from the screenshot in the browser:
/// a PNG data URL, small (the page scales it to 160 px wide), and nothing
/// else — it is shown to the group as an image.
pub const MAX_FLAG: usize = 24 * 1024;

pub fn flag(v: &str) -> Result<(), &'static str> {
    const PREFIX: &str = "data:image/png;base64,";
    let Some(b64) = v.strip_prefix(PREFIX) else { return Err("flag_not_png") };
    if v.len() > MAX_FLAG {
        return Err("flag_too_large");
    }
    if b64.is_empty() || !b64.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'+' || c == b'/' || c == b'=') {
        return Err("flag_not_png");
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
        assert_eq!(username("Zoe\u{0301}"), Ok("Zoé".into()));      // decomposed é, stored composed
        assert!(username("a").is_err());
        assert!(username("<script>").is_err());
        assert!(username(&"x".repeat(25)).is_err());
        assert!(username("\u{0430}drien").is_err());                // Cyrillic а
        assert!(username("Zoé×2").is_err());
    }

    #[test]
    fn look_alikes_the_review_found_share_a_key() {
        assert_eq!(username_key("Adrıen"), username_key("Adrien"));
        assert_eq!(username_key("AIice"), username_key("Alice"));
        assert_eq!(username_key("Jean  Paul"), username_key("Jean-Paul"));
        assert_eq!(username_key("Bjørn"), username_key("Bjorn"));
        assert_eq!(username("Jean   Paul"), Ok("Jean Paul".into()));
    }

    #[test]
    fn look_alikes_share_a_key() {
        assert_eq!(username_key("Zoé"), username_key("ZOÉ"));
        assert_eq!(username_key("Zoé"), username_key("zoe"));
        assert_eq!(username_key("Zoe\u{0301}"), username_key("Zoé"));
        assert_ne!(username_key("Zoé"), username_key("Zoa"));
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
    fn flag_shapes() {
        assert!(flag("data:image/png;base64,iVBORw0KGgo=").is_ok());
        assert!(flag("data:image/svg+xml;base64,PHN2Zz4=").is_err());
        assert!(flag("javascript:alert(1)").is_err());
        assert!(flag("data:image/png;base64,<b>").is_err());
        assert!(flag(&format!("data:image/png;base64,{}", "A".repeat(MAX_FLAG))).is_err());
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
