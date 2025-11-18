class Word {
    /**
     * @param {string} text 
     * @param {string} spanId
     * @param {Color} color 
     */
    constructor(text, spanId, color) {
        this.text = text;
        if (this.text === "\n") {
            this.isBr = true;
            // 换行不会有span
            this.spanId = -1;
        }
        else {
            this.isBr = false;
            this.spanId = spanId;
            this.color = color;
            this.x = -1;
            this.y = -1;
        }
    }

    /**
     * 设置位置
     * @param {DOMRect} wordsLoc getBoundingClientRect
     */
    setLocs(wordsLoc) {
        this.locStartX = wordsLoc.x;
        this.locStartY = wordsLoc.y;
        this.width = wordsLoc.width;
        this.height = wordsLoc.height;
        this.x = parseInt(this.locStartX + this.width / 2);
        this.y = parseInt(this.locStartY + this.height / 2);
        return this;
    }

    toSpan(fontstyle) {
        if (this.isBr) return "<br>";
        return "<span class='pvspan' id='" + this.spanId + "' style='color:" + this.color.toString() + ";" + fontstyle + "'>" + this.text + "</span>";
    }
}

class RGB {
    /**
     * @param {number} r 
     * @param {number} g 
     * @param {number} b 
     */
    constructor(r, g, b) {
        this.r = this.limitInt(parseInt(r), 0, 255);
        this.g = this.limitInt(parseInt(g), 0, 255);
        this.b = this.limitInt(parseInt(b), 0, 255);
    }

    /**
     * @param {number} num 
     * @param {number} min 
     * @param {number} max 
     * @returns {number}
     */
    limitInt(num, min, max) {
        if (num < min) return min;
        else if (num > max) return max;
        else return num;
    }

    /**
     * @param {number} dec 
     * @returns {string}
     */
    DEC2HEX(dec) {
        let s = dec.toString(16);
        if (s.length < 2) s = "0" + s;
        return s;
    }

    /**
     * @returns {[number,number,number]}
     */
    toHSV() {
        let [R, G, B] = [this.r / 255, this.g / 255, this.b / 255];
        let [H, S, V] = [0, 0, 0];
        let max = Math.max(R, G, B);
        let min = Math.min(R, G, B);
        V = max;
        S = (max - min) / max;
        if (R === max) H = (G - B) / (max - min) * 60;
        if (G === max) H = 120 + (B - R) / (max - min) * 60;
        if (B === max) H = 240 + (R - G) / (max - min) * 60;
        if (H < 0) H = H + 360;
        return [H, S, V];
    }

    toString() {
        return "#" + this.DEC2HEX(this.r) + this.DEC2HEX(this.g) + this.DEC2HEX(this.b);
    }
}

class HSV {
    /**
     * @param {number} h 
     * @param {number} s 
     * @param {number} v 
     */
    constructor(h, s, v) {
        this.h = this.limitInt(parseFloat(h), 0, 360);
        this.s = this.limitInt(parseFloat(s), 0, 1);
        this.v = this.limitInt(parseFloat(v), 0, 1);
    }

    /**
    * @param {number} num 
    * @param {number} min 
    * @param {number} max 
    * @returns {number}
    */
    limitInt(num, min, max) {
        if (num < min) return min;
        else if (num > max) return max;
        else return num;
    }

    /**
     * @returns {[number,number,number]}
     */
    toRGB() {
        let [H, S, V] = [this.h, this.s, this.v];
        let [R, G, B] = [0, 0, 0];
        if (S === 0) R = G = B = V;
        else {
            H /= 60;
            let i = Math.floor(H);
            let f = H - i;
            let a = V * (1 - S);
            let b = V * (1 - S * f);
            let c = V * (1 - S * (1 - f));
            switch (i) {
                case 0: R = V; G = c; B = a; break;
                case 1: R = b; G = V; B = a; break;
                case 2: R = a; G = V; B = c; break;
                case 3: R = a; G = b; B = V; break;
                case 4: R = c; G = a; B = V; break;
                case 5: R = V; G = a; B = b; break;
                default: console.log("HSV2color Error");
            }
            R = Math.floor(R * 255);
            G = Math.floor(G * 255);
            B = Math.floor(B * 255);
            return [R, G, B];
        }
    }
}

class Color {
    /**
     * @param {string|Array<number>} param "#AAFF00" or [170,255,0]
     * @param {boolean} isRGB if param is array, true: RGB, false: HSV
     */
    constructor(param, isRGB = true) {
        if (typeof param === "string") {
            this.rgb = new RGB(...this.colorText2RGB(param));
            this.hsv = new HSV(...this.rgb.toHSV());
        }
        else if (isRGB) {
            this.rgb = new RGB(...param);
            this.hsv = new HSV(...this.rgb.toHSV());
        }
        else {
            this.hsv = new HSV(...param);
            this.rgb = new RGB(...this.hsv.toRGB());
        }
    }

    /**
     * @param {string} colorText RGB code as #AAFF00
     * @returns {[number,number,number]} [r,g,b]
     */
    colorText2RGB(colorText) {
        let rgb = [];
        for (let i = 1; i < 7; i += 2) {
            rgb.push(parseInt('0x' + colorText.substr(i, 2)));
        }
        return rgb;
    }

    toString() {
        return this.rgb.toString();
    }
}

class ColorGenerator {
    /**
     * @param {Array<Word>} words 
     * @param {Color} startColor 
     * @param {Color} endColor 
     * @param {number} cycleCount 循环次数
     * @param {string} cycleMode 循环模式: 'none' | 'repeat' | 'reflect'
     */
    constructor(words, startColor, endColor, cycleCount = 1, cycleMode = 'none') {
        this.words = words;
        this.startColor = startColor;
        this.endColor = endColor;
        this.cycleCount = cycleCount;
        this.cycleMode = cycleMode;
        this.initContentSize();
    }

    initContentSize() {
        let xmin = this.words[0].x;
        let xmax = this.words[0].x;
        let ymin = this.words[0].y;
        let ymax = this.words[0].y;
        this.words.map((word) => {
            if (!word || word.isBr) return;
            if (word.x > xmax) xmax = word.x;
            if (word.x < xmin) xmin = word.x;
            if (word.y > ymax) ymax = word.y;
            if (word.y < ymin) ymin = word.y;
        });
        this.x1px2 = xmin - xmax;
        this.x1ax2 = xmin + xmax;
        this.y1py2 = ymin - ymax;
        this.y1ay2 = ymin + ymax;
        this.k = 2 * (this.x1px2 * this.x1px2 + this.y1py2 * this.y1py2);
    }

    /**
     * 处理循环和折返的比例变换
     * @param {number} ratio 原始比例 0-1
     * @returns {number} 变换后的比例 0-1
     */
    transformRatio(ratio) {
        if (this.cycleMode === 'none' || this.cycleCount <= 1) {
            return ratio;
        }

        const totalLength = this.cycleCount;
        let transformedRatio = ratio * totalLength;
        
        if (this.cycleMode === 'repeat') {
            // 重复模式：直接取小数部分
            transformedRatio = transformedRatio % 1;
        } else if (this.cycleMode === 'reflect') {
            // 折返模式：锯齿波
            const cycleIndex = Math.floor(transformedRatio);
            const cycleRatio = transformedRatio % 1;
            
            if (cycleIndex % 2 === 0) {
                // 偶数周期：正向
                transformedRatio = cycleRatio;
            } else {
                // 奇数周期：反向
                transformedRatio = 1 - cycleRatio;
            }
        }
        
        return transformedRatio;
    }

    /**
     * 返回该点颜色渐变占总渐变的比值，0-1
     * @param {number} x 
     * @param {number} y 
     * @returns {number}
     */
    calColorRatio(x, y) {
        let ratio = ((this.x1ax2 - 2 * x) * this.x1px2 + (this.y1ay2 - 2 * y) * this.y1py2) / this.k + 0.5;
        return this.transformRatio(ratio);
    }

    /**
     * @param {number} begin 
     * @param {number} end 
     * @param {number} ratio 0-1
     * @returns {number}
     */
    getInnerNum(begin, end, ratio) {
        return begin + (end - begin) * ratio;
    }

    createColorsByRGB() {
        const startR = this.startColor.rgb.r;
        const endR = this.endColor.rgb.r;
        const startG = this.startColor.rgb.g;
        const endG = this.endColor.rgb.g;
        const startB = this.startColor.rgb.b;
        const endB = this.endColor.rgb.b;
        this.words = this.words.map((word)=> {
            let x = word.x;
            let y = word.y;
            let ratio = this.calColorRatio(x, y);
            let r = this.getInnerNum(startR, endR, ratio);
            let g = this.getInnerNum(startG, endG, ratio);
            let b = this.getInnerNum(startB, endB, ratio);
            word.color = new Color([r, g, b], true);
            return word;
        });
        return this.words;
    }

    createColorsByHSV() {
        const startH = this.startColor.hsv.h;
        const endH = this.endColor.hsv.h;
        const startS = this.startColor.hsv.s;
        const endS = this.endColor.hsv.s;
        const startV = this.startColor.hsv.v;
        const endV = this.endColor.hsv.v;
        this.words = this.words.map((word)=> {
            let x = word.x;
            let y = word.y;
            let ratio = this.calColorRatio(x, y);
            let h = this.getInnerNum(startH, endH, ratio);
            let s = this.getInnerNum(startS, endS, ratio);
            let v = this.getInnerNum(startV, endV, ratio);
            word.color = new Color([h, s, v], false);
            return word;
        });
        return this.words;
    }

    /**
     * @param {string} colorType RGB/HSV
     */
    applyColors(colorType) {
        if (colorType === "HSV") {
            return this.createColorsByHSV();
        }
        else {
            return this.createColorsByRGB();
        }
    }
}

class WordCollection{
    /**
     * @param {Array<Word>} words
     */
    constructor(words) {
        this.words = words;
        // 改为相对坐标
        let firstWord = this.words.find((word) => word.isBr === false);
        if (!firstWord) return;
        let xmin = firstWord.x;
        let xmax = firstWord.x;
        let ymin = firstWord.y;
        let ymax = firstWord.y;
        this.words.map((word) => {
            if (!word || word.isBr) return;
            if (word.x > xmax) xmax = word.x;
            if (word.x < xmin) xmin = word.x;
            if (word.y > ymax) ymax = word.y;
            if (word.y < ymin) ymin = word.y;
        });
        this.words = this.words.map((word) => {
            if (!word || word.isBr) return word;
            word.x -= xmin;
            word.y -= ymin;
            return word;
        });
        this.picWidth = xmax - xmin;
        this.picHeight = ymax - ymin;
    }

    /**
     * 获取框选到的word，既然能框选到应该不是换行符
     * @param {Array<number>} spanIndexs 
     * @returns {Array<Word>}
     */
    getWords(spanIndexs) {
        return spanIndexs.map((i) => {
            return this.words.find((word) => word.spanId === i);
        })
    }

    /**
     * 选择所有可见的word
     * @returns {Array<Word>}
     */
    chooseAllWords() {
        return this.words.filter((word) => word.isBr === false);
    }

    /**
     * 将填色好的words覆盖原先的
     * @param {Array<Word>} newWords 
     */
    applyWords(newWords) {
        newWords.map((newword) => {
            this.words.find((word) => word.spanId === newword.spanId).color = newword.color;
        })
        return this;
    }

    createOneCode(codeType, nowWord, nowColor, defaultColor) {
        if (nowColor === defaultColor) return nowWord;
        else return codeType.replace("%%color", nowColor).replace("%%words", nowWord)
    }

    /**
     * 生成bbcode
     * @param {string} codeType "[color=%%color]%%words[/color]"
     * @param {Color} defaultFontColor 无颜色标签时默认颜色
     * @returns {string} bbcode
     */
    createCode(codeType, defaultFontColor) {
        let codes = [];
        let nowWord = "";
        let nowColor = "";
        let defaultColor = defaultFontColor.toString();
        let endIndex = this.words.length - 1;
        this.words.map((word, index) => {
            // 这里同时会做精简工作：
            // 1. 合并同种颜色
            // 2. 颜色为默认字体颜色时不指定颜色
            // 3. 空格不指定颜色
            if (word.text === "\n") {
                // 将合并的一起放出来
                if(nowWord !== "") codes.push(this.createOneCode(codeType, nowWord, nowColor, defaultColor));
                nowWord = "";
                nowColor = "";
                codes.push("\n");
            }
            else if (word.text === " ") {
                // 空格无颜色，直接加入
                nowWord += " ";
            }
            else {
                let _wordText = word.text;
                let _colorText = word.color.toString();
                if (nowColor !== _colorText) {
                    // 将合并的一起放出来
                    if(nowWord !== "") codes.push(this.createOneCode(codeType, nowWord, nowColor, defaultColor));
                    if (index !== endIndex) {
                        // 先留存第一个，等下一个
                        nowWord = _wordText;
                        nowColor = _colorText;
                    }
                    else {
                        // 直接添加最后一个
                        codes.push(this.createOneCode(codeType, _wordText, _colorText, defaultColor));
                    }
                }
                else {
                    // 先留存，等下一个
                    nowWord += _wordText;
                    if (index === endIndex) {
                        // 最后一个全部放出
                        codes.push(this.createOneCode(codeType, nowWord, nowColor, defaultColor));
                    }
                }
            }
        });
        return codes.join("");
    }
}