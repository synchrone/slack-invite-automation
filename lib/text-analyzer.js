const separatorPipe = function(input) {
    return input.map(o => {
        if (['!', '?', '.', '...', '?!', '!?', "\n"].includes(o.separator)) {
            return o;
        }

        if (/(\.\.)/.test(o.separator)) {
            o.separator = '...'

            return o
        }

        const rules = [
            {'rules': ['!', '?'], 'separator': '?!'},
            {'rules': ['!'], 'separator': '!'},
            {'rules': ['?'], 'separator': '?'}
        ]
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i]
            let passed = true

            for (let j = 0; j < rule.rules.length; j++) {
                const subRule = rule.rules[j];

                if (o.separator.indexOf(subRule) === -1) {
                    passed = false
                }
            }

            if (passed === true) {
                o.separator = rule.separator

                return o
            }
        }

        o.separator = '.'

        return o;
    });
}

const whitespacePipe = function(input) {
    return input.map(o => {
        o.text = o.text.replace(/\s\s+/g, ' ');

        return o;
    });
}

const dashPipe = function(input) {
    return input.map(o => {
        o.text = o.text.replace(/ - /g, ' — ');

        return o;
    });
}

const commaPipe = function(input) {
    return input.map(o => {
        o.text = o.text.replace(/,([^\s])/g, ", $1");

        return o;
    });
}

const dotNewlinePipe = function(input) {
    return input.map(o => {
        if (o.separator !== "\n") {
            return o
        }

        if (o.text && !/\.$/.test(o.text)) {
            o.text = o.text + '.'
        }

        return o;
    });
}

const excessiveNewlinePipe = function(input) {
    for (let i = 0; i < input.length; i++) {
        const o = input[i]

        if (i >= 1 && o.separator === "\n" && input[i + 1].separator === "\n") {
            delete input[i]
        }
    }

    return input.filter(() => true)
}

const bracketsPipe = function(input) {
    return input.map(o => {
        o.text = o.text
            .replace(/\(([\s]+)([^\s])/g, "($2")
            .replace(/([а-яА-Яa-zA-Z0-9.,!?"]+)([ ]+)\)/g, "$1)");

        return o;
    });
}

const finalize = function(input) {
    let text = ''

    for (let i = 0; i < input.length; i++) {
        const o = input[i]

        if (i > 0 && input[i - 1].separator !== "\n") {
            text = text + ' ' + o.text + o.separator
        } else {
            text = text + o.text + o.separator
        }
    }

    return text
}

module.exports = {
    separatorPipe: separatorPipe,
    whitespacePipe: whitespacePipe,
    dashPipe: dashPipe,
    commaPipe: commaPipe,
    bracketsPipe: bracketsPipe,
    dotNewlinePipe: dotNewlinePipe,
    excessiveNewlinePipe: excessiveNewlinePipe,
    finalize: finalize
}
