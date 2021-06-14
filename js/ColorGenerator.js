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
     * @param {string} line 
     * @param {Color} startColor 
     * @param {Color} endColor 
     */
    constructor(line, startColor, endColor) {
        this.line = line;
        this.startColor = startColor;
        this.endColor = endColor;
        this.words = line.split("");
        this.colors = [];
    }

    /**
     * @param {number} begin 
     * @param {number} end 
     * @param {number} length 
     * @returns {Array<number>}
     */
    numSpliter(begin, end, length) {
        let arr = [];
        if (length <= 1) return [begin];
        const step = (end - begin) / (length - 1);
        let index = 0;
        while (index < length) {
            let cval = begin + step * index;
            arr.push(cval);
            index += 1;
        }
        return arr;
    }

    createColorsByRGB(colorLength = -1, pickStart = 0) {
        this.colors = [];
        const length = this.words.length;
        if (colorLength <= 0) colorLength = length;
        if (pickStart < 0) pickStart = 0;
        if ((length + pickStart) > colorLength) pickStart = colorLength - length;
        const startR = this.startColor.rgb.r;
        const endR = this.endColor.rgb.r;
        const startG = this.startColor.rgb.g;
        const endG = this.endColor.rgb.g;
        const startB = this.startColor.rgb.b;
        const endB = this.endColor.rgb.b;
        const arrR = this.numSpliter(startR, endR, colorLength);
        const arrG = this.numSpliter(startG, endG, colorLength);
        const arrB = this.numSpliter(startB, endB, colorLength);
        let index = 0;
        while (index < length) {
            let pickIndex = index + pickStart;
            let color = new Color([arrR[pickIndex], arrG[pickIndex], arrB[pickIndex]], true);
            this.colors.push(color.toString());
            index += 1;
        }
    }

    createColorsByHSV(colorLength = -1, pickStart = 0) {
        this.colors = [];
        const length = this.words.length;
        if (colorLength <= 0) colorLength = length;
        if (pickStart < 0) pickStart = 0;
        if ((length + pickStart) > colorLength) pickStart = colorLength - length;
        const startH = this.startColor.hsv.h;
        const endH = this.endColor.hsv.h;
        const startS = this.startColor.hsv.s;
        const endS = this.endColor.hsv.s;
        const startV = this.startColor.hsv.v;
        const endV = this.endColor.hsv.v;
        const arrH = this.numSpliter(startH, endH, colorLength);
        const arrS = this.numSpliter(startS, endS, colorLength);
        const arrV = this.numSpliter(startV, endV, colorLength);
        let index = 0;
        while (index < length) {
            let pickIndex = index + pickStart;
            let color = new Color([arrH[pickIndex], arrS[pickIndex], arrV[pickIndex]], false);
            this.colors.push(color.toString());
            index += 1;
        }
    }

    /**
     * @param {string} colorType RGB/HSV
     * @param {number} colorLength force length for multi line
     * @param {number} pickStart not start from startcolor when multi line
     */
    applyColors(colorType, colorLength = -1, pickStart = 0) {
        if (this.startColor.toString() === this.endColor.toString()) {
            return { words: [this.line], colors: [this.startColor.toString()] };
        }
        if (colorType === "HSV") {
            this.createColorsByHSV(colorLength, pickStart);
        }
        else {
            this.createColorsByRGB(colorLength, pickStart);
        }
        return { words: this.words, colors: this.colors };
    }
}


