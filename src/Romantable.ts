// ひらがな → ローマ字候補テーブル
// 2文字の組み合わせ（拗音など）を先に定義することで優先マッチさせる
export const RomanTable: Record<string, string[]> = {
    // 拗音（2文字）- 1文字より先にチェックする必要があるため先頭に置く
    きゃ: ["kya"],
    きゅ: ["kyu"],
    きょ: ["kyo"],
    しゃ: ["sha", "sya"],
    しゅ: ["shu", "syu"],
    しょ: ["sho", "syo"],
    ちゃ: ["cha", "tya"],
    ちゅ: ["chu", "tyu"],
    ちょ: ["cho", "tyo"],
    にゃ: ["nya"],
    にゅ: ["nyu"],
    にょ: ["nyo"],
    ひゃ: ["hya"],
    ひゅ: ["hyu"],
    ひょ: ["hyo"],
    みゃ: ["mya"],
    みゅ: ["myu"],
    みょ: ["myo"],
    りゃ: ["rya"],
    りゅ: ["ryu"],
    りょ: ["ryo"],
    ぎゃ: ["gya"],
    ぎゅ: ["gyu"],
    ぎょ: ["gyo"],
    じゃ: ["ja", "zya"],
    じゅ: ["ju", "zyu"],
    じょ: ["jo", "zyo"],
    びゃ: ["bya"],
    びゅ: ["byu"],
    びょ: ["byo"],
    ぴゃ: ["pya"],
    ぴゅ: ["piu"],
    ぴょ: ["pyo"],
    // 1文字
    あ: ["a"],
    い: ["i"],
    う: ["u"],
    え: ["e"],
    お: ["o"],
    か: ["ka"],
    き: ["ki"],
    く: ["ku"],
    け: ["ke"],
    こ: ["ko"],
    さ: ["sa"],
    し: ["shi", "si"],
    す: ["su"],
    せ: ["se"],
    そ: ["so"],
    た: ["ta"],
    ち: ["chi", "ti"],
    つ: ["tsu", "tu"],
    て: ["te"],
    と: ["to"],
    な: ["na"],
    に: ["ni"],
    ぬ: ["nu"],
    ね: ["ne"],
    の: ["no"],
    は: ["ha", "wa"],
    ひ: ["hi"],
    ふ: ["fu", "hu"],
    へ: ["he"],
    ほ: ["ho"],
    ま: ["ma"],
    み: ["mi"],
    む: ["mu"],
    め: ["me"],
    も: ["mo"],
    や: ["ya"],
    ゆ: ["yu"],
    よ: ["yo"],
    ら: ["ra"],
    り: ["ri"],
    る: ["ru"],
    れ: ["re"],
    ろ: ["ro"],
    わ: ["wa"],
    を: ["wo"],
    ん: ["nn", "n"],
    が: ["ga"],
    ぎ: ["gi"],
    ぐ: ["gu"],
    げ: ["ge"],
    ご: ["go"],
    ざ: ["za"],
    じ: ["ji", "zi"],
    ず: ["zu"],
    ぜ: ["ze"],
    ぞ: ["zo"],
    だ: ["da"],
    ぢ: ["di"],
    づ: ["du"],
    で: ["de"],
    ど: ["do"],
    ば: ["ba"],
    び: ["bi"],
    ぶ: ["bu"],
    べ: ["be"],
    ぼ: ["bo"],
    ぱ: ["pa"],
    ぴ: ["pi"],
    ぷ: ["pu"],
    ぺ: ["pe"],
    ぽ: ["po"],
    ぁ: ["la", "xa"],
    ぃ: ["li", "xi"],
    ぅ: ["lu", "xu"],
    ぇ: ["le", "xe"],
    ぉ: ["lo", "xo"],
    ゃ: ["lya", "xya"],
    ゅ: ["lyu", "xyu"],
    ょ: ["lyo", "xyo"],
    っ: ["ltu", "xtu"],
    ー: ["-"],
    " ": [" "],
};

/**
 * ひらがな文字列から、ローマ字の全候補（文字列の配列）を生成する。
 * 「っ」の後に子音が来る場合は子音を重ねる形（"kk", "ss"など）も候補に加える。
 *
 * 例: "ちょ" → ["cho", "tya"]
 * 例: "っち" → ["cchi", "tti", "ltuchi", "ltuti", "xtuchi", "xtuti"]
 */
export function generateCandidates(reading: string): string[] {
    // 再帰的に全候補を列挙する内部関数
    function expand(str: string): string[] {
        if (str.length === 0) return [""];

        // 「っ」の特殊処理：次の文字の先頭子音を重ねる
        if (str[0] === "っ") {
            const rest = str.slice(1);
            if (rest.length > 0) {
                const nextCandidates = expand(rest);
                const doubled = nextCandidates
                    .map((c) => {
                        // 次の候補の先頭が子音なら重ねる
                        if (c.length > 0 && !/^[aiueo]/.test(c)) {
                            return c[0] + c;
                        }
                        return null;
                    })
                    .filter((c): c is string => c !== null);
                // ltu/xtu の通常表記も加える
                const normalLtu = ["ltu", "xtu"].flatMap((prefix) =>
                    nextCandidates.map((c) => prefix + c),
                );
                return [...doubled, ...normalLtu];
            }
            // っ単体（末尾）
            const ltuResults = expand(str.slice(1));
            return ["ltu", "xtu"].flatMap((p) => ltuResults.map((r) => p + r));
        }

        // 2文字の組み合わせを優先チェック
        if (str.length >= 2) {
            const two = str.slice(0, 2);
            if (RomanTable[two]) {
                const restCandidates = expand(str.slice(2));
                return RomanTable[two].flatMap((r) =>
                    restCandidates.map((c) => r + c),
                );
            }
        }

        // 1文字チェック
        const one = str[0];
        if (RomanTable[one]) {
            const restCandidates = expand(str.slice(1));
            return RomanTable[one].flatMap((r) =>
                restCandidates.map((c) => r + c),
            );
        }

        // テーブルにない文字はそのまま通す（念のため）
        const restCandidates = expand(str.slice(1));
        return restCandidates.map((c) => one + c);
    }

    // 重複を除いて返す
    return [...new Set(expand(reading))];
}

/**
 * 現在の入力文字列 `typed` が、いずれかの候補のプレフィックスになっているかを確認する。
 * また、完全一致した候補があればその文字列も返す。
 *
 * @returns { isValid: boolean; matched: string | null }
 *   isValid  - typed が少なくとも1つの候補のプレフィックスなら true
 *   matched  - 完全一致した候補文字列（なければ null）
 */
export function matchInput(
    typed: string,
    candidates: string[],
): { isValid: boolean; matched: string | null } {
    let isValid = false;
    let matched: string | null = null;

    for (const c of candidates) {
        if (c === typed) {
            matched = c;
            isValid = true;
            break;
        }
        if (c.startsWith(typed)) {
            isValid = true;
        }
    }

    return { isValid, matched };
}
