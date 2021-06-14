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
     * @param {Array<string>} words 
     * @param {Color} startColor 
     * @param {Color} endColor 
     * @param {Array<{x:number, y:number}>} wordsLoc getBoundingClientRect
     */
    constructor(words, startColor, endColor, wordsLoc) {
        this.words = words;
        this.startColor = startColor;
        this.endColor = endColor;
        this.wordsLoc = wordsLoc;
        this.initContentSize();
    }

    initContentSize() {
        let xmin = this.wordsLoc[0].x;
        let xmax = this.wordsLoc[0].x;
        let ymin = this.wordsLoc[0].y;
        let ymax = this.wordsLoc[0].y;
        this.wordsLoc.map((point) => {
            if (!point) return;
            if (point.x > xmax) xmax = point.x;
            if (point.x < xmin) xmin = point.x;
            if (point.y > ymax) ymax = point.y;
            if (point.y < ymin) ymin = point.y;
        });
        this.startLoc = { x: xmin, y: ymin };
        this.endLoc = { x: xmax, y: ymax };
        this.x1px2 = xmin - xmax;
        this.x1ax2 = xmin + xmax;
        this.y1py2 = ymin - ymax;
        this.y1ay2 = ymin + ymax;
        this.k = 2 * (this.x1px2 * this.x1px2 + this.y1py2 * this.y1py2);
    }

    /**
     * 返回该点颜色渐变占总渐变的比值，0-1
     * @param {number} x 
     * @param {number} y 
     * @returns {number}
     */
    calColorRatio(x, y) {
        return ((this.x1ax2 - 2 * x) * this.x1px2 + (this.y1ay2 - 2 * y) * this.y1py2) / this.k + 0.5;
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
        const colors = this.words.map((word, index)=> {
            if (word === "\n" || word === " ") return null;
            let x = this.wordsLoc[index].x;
            let y = this.wordsLoc[index].y;
            let ratio = this.calColorRatio(x, y);
            let r = this.getInnerNum(startR, endR, ratio);
            let g = this.getInnerNum(startG, endG, ratio);
            let b = this.getInnerNum(startB, endB, ratio);
            let color = new Color([r, g, b], true);
            return color.toString();
        });
        return colors;
    }

    createColorsByHSV() {
        const startH = this.startColor.hsv.h;
        const endH = this.endColor.hsv.h;
        const startS = this.startColor.hsv.s;
        const endS = this.endColor.hsv.s;
        const startV = this.startColor.hsv.v;
        const endV = this.endColor.hsv.v;
        const colors = this.words.map((word, index)=> {
            if (word === "\n" || word === " ") return null;
            let x = this.wordsLoc[index].x;
            let y = this.wordsLoc[index].y;
            let ratio = this.calColorRatio(x, y);
            let h = this.getInnerNum(startH, endH, ratio);
            let s = this.getInnerNum(startS, endS, ratio);
            let v = this.getInnerNum(startV, endV, ratio);
            let color = new Color([h, s, v], false);
            return color.toString();
        });
        return colors;
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


