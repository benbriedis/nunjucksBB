'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const lexer_1 = __importDefault(require("./lexer"));
const nodes_1 = __importDefault(require("./nodes"));
const object_1 = require("./object");
const lib_1 = __importDefault(require("./lib"));
class Parser extends object_1.Obj {
    tokens;
    peeked;
    breakOnBlocks;
    dropLeadingWhitespace;
    extensions;
    init(tokens) {
        this.tokens = tokens;
        this.peeked = null;
        this.breakOnBlocks = null;
        this.dropLeadingWhitespace = false;
        this.extensions = [];
    }
    nextToken(withWhitespace = undefined) {
        var tok;
        if (this.peeked) {
            if (!withWhitespace && this.peeked.type === lexer_1.default.TOKEN_WHITESPACE) {
                this.peeked = null;
            }
            else {
                tok = this.peeked;
                this.peeked = null;
                return tok;
            }
        }
        tok = this.tokens.nextToken();
        if (!withWhitespace) {
            while (tok && tok.type === lexer_1.default.TOKEN_WHITESPACE) {
                tok = this.tokens.nextToken();
            }
        }
        return tok;
    }
    peekToken() {
        this.peeked = this.peeked || this.nextToken();
        return this.peeked;
    }
    pushToken(tok) {
        if (this.peeked) {
            throw new Error('pushToken: can only push one token on between reads');
        }
        this.peeked = tok;
    }
    error(msg, lineno, colno) {
        if (lineno === undefined || colno === undefined) {
            const tok = this.peekToken() || {};
            lineno = tok.lineno;
            colno = tok.colno;
        }
        if (lineno !== undefined) {
            lineno += 1;
        }
        if (colno !== undefined) {
            colno += 1;
        }
        return new lib_1.default.TemplateError(msg, lineno, colno);
    }
    fail(msg, lineno = undefined, colno = undefined) {
        throw this.error(msg, lineno, colno);
    }
    skip(type) {
        var tok = this.nextToken();
        if (!tok || tok.type !== type) {
            this.pushToken(tok);
            return false;
        }
        return true;
    }
    expect(type) {
        var tok = this.nextToken();
        if (tok.type !== type) {
            this.fail('expected ' + type + ', got ' + tok.type, tok.lineno, tok.colno);
        }
        return tok;
    }
    skipValue(type, val) {
        var tok = this.nextToken();
        if (!tok || tok.type !== type || tok.value !== val) {
            this.pushToken(tok);
            return false;
        }
        return true;
    }
    skipSymbol(val) {
        return this.skipValue(lexer_1.default.TOKEN_SYMBOL, val);
    }
    advanceAfterBlockEnd(name = undefined) {
        var tok;
        if (!name) {
            tok = this.peekToken();
            if (!tok) {
                this.fail('unexpected end of file');
            }
            if (tok.type !== lexer_1.default.TOKEN_SYMBOL) {
                this.fail('advanceAfterBlockEnd: expected symbol token or ' +
                    'explicit name to be passed');
            }
            name = this.nextToken().value;
        }
        tok = this.nextToken();
        if (tok && tok.type === lexer_1.default.TOKEN_BLOCK_END) {
            if (tok.value.charAt(0) === '-') {
                this.dropLeadingWhitespace = true;
            }
        }
        else {
            this.fail('expected block end in ' + name + ' statement');
        }
        return tok;
    }
    advanceAfterVariableEnd() {
        var tok = this.nextToken();
        if (tok && tok.type === lexer_1.default.TOKEN_VARIABLE_END) {
            this.dropLeadingWhitespace = tok.value.charAt(tok.value.length - this.tokens.tags.VARIABLE_END.length - 1) === '-';
        }
        else {
            this.pushToken(tok);
            this.fail('expected variable end');
        }
    }
    parseFor() {
        var forTok = this.peekToken();
        var node;
        var endBlock;
        if (this.skipSymbol('for')) {
            node = new nodes_1.default.For(forTok.lineno, forTok.colno);
            endBlock = 'endfor';
        }
        else if (this.skipSymbol('asyncEach')) {
            node = new nodes_1.default.AsyncEach(forTok.lineno, forTok.colno);
            endBlock = 'endeach';
        }
        else if (this.skipSymbol('asyncAll')) {
            node = new nodes_1.default.AsyncAll(forTok.lineno, forTok.colno);
            endBlock = 'endall';
        }
        else {
            this.fail('parseFor: expected for{Async}', forTok.lineno, forTok.colno);
        }
        node.name = this.parsePrimary();
        if (!(node.name instanceof nodes_1.default.Symbol)) {
            this.fail('parseFor: variable name expected for loop');
        }
        const type = this.peekToken().type;
        if (type === lexer_1.default.TOKEN_COMMA) {
            // key/value iteration
            const key = node.name;
            node.name = new nodes_1.default.Array(key.lineno, key.colno);
            node.name.addChild(key);
            while (this.skip(lexer_1.default.TOKEN_COMMA)) {
                const prim = this.parsePrimary();
                node.name.addChild(prim);
            }
        }
        if (!this.skipSymbol('in')) {
            this.fail('parseFor: expected "in" keyword for loop', forTok.lineno, forTok.colno);
        }
        node.arr = this.parseExpression();
        this.advanceAfterBlockEnd(forTok.value);
        node.body = this.parseUntilBlocks(endBlock, 'else');
        if (this.skipSymbol('else')) {
            this.advanceAfterBlockEnd('else');
            node.else_ = this.parseUntilBlocks(endBlock);
        }
        this.advanceAfterBlockEnd();
        return node;
    }
    parseMacro() {
        const macroTok = this.peekToken();
        if (!this.skipSymbol('macro')) {
            this.fail('expected macro');
        }
        const name = this.parsePrimary(true);
        const args = this.parseSignature();
        const node = new nodes_1.default.Macro(macroTok.lineno, macroTok.colno, name, args);
        this.advanceAfterBlockEnd(macroTok.value);
        node.body = this.parseUntilBlocks('endmacro');
        this.advanceAfterBlockEnd();
        return node;
    }
    parseCall() {
        // a call block is parsed as a normal FunCall, but with an added
        // 'caller' kwarg which is a Caller node.
        var callTok = this.peekToken();
        if (!this.skipSymbol('call')) {
            this.fail('expected call');
        }
        const callerArgs = this.parseSignature(true) || new nodes_1.default.NodeList();
        const macroCall = this.parsePrimary();
        this.advanceAfterBlockEnd(callTok.value);
        const body = this.parseUntilBlocks('endcall');
        this.advanceAfterBlockEnd();
        const callerName = new nodes_1.default.Symbol(callTok.lineno, callTok.colno, 'caller');
        const callerNode = new nodes_1.default.Caller(callTok.lineno, callTok.colno, callerName, callerArgs, body);
        // add the additional caller kwarg, adding kwargs if necessary
        const args = macroCall.args.children;
        if (!(args[args.length - 1] instanceof nodes_1.default.KeywordArgs)) {
            args.push(new nodes_1.default.KeywordArgs());
        }
        const kwargs = args[args.length - 1];
        kwargs.addChild(new nodes_1.default.Pair(callTok.lineno, callTok.colno, callerName, callerNode));
        return new nodes_1.default.Output(callTok.lineno, callTok.colno, [macroCall]);
    }
    parseWithContext() {
        var tok = this.peekToken();
        var withContext = null;
        if (this.skipSymbol('with')) {
            withContext = true;
        }
        else if (this.skipSymbol('without')) {
            withContext = false;
        }
        if (withContext !== null) {
            if (!this.skipSymbol('context')) {
                this.fail('parseFrom: expected context after with/without', tok.lineno, tok.colno);
            }
        }
        return withContext;
    }
    parseImport() {
        var importTok = this.peekToken();
        if (!this.skipSymbol('import')) {
            this.fail('parseImport: expected import', importTok.lineno, importTok.colno);
        }
        const template = this.parseExpression();
        if (!this.skipSymbol('as')) {
            this.fail('parseImport: expected "as" keyword', importTok.lineno, importTok.colno);
        }
        const target = this.parseExpression();
        const withContext = this.parseWithContext();
        const node = new nodes_1.default.Import(importTok.lineno, importTok.colno, template, target, withContext);
        this.advanceAfterBlockEnd(importTok.value);
        return node;
    }
    parseFrom() {
        const fromTok = this.peekToken();
        if (!this.skipSymbol('from')) {
            this.fail('parseFrom: expected from');
        }
        const template = this.parseExpression();
        if (!this.skipSymbol('import')) {
            this.fail('parseFrom: expected import', fromTok.lineno, fromTok.colno);
        }
        const names = new nodes_1.default.NodeList();
        let withContext;
        while (1) { // eslint-disable-line no-constant-condition
            const nextTok = this.peekToken();
            if (nextTok.type === lexer_1.default.TOKEN_BLOCK_END) {
                if (!names.children.length) {
                    this.fail('parseFrom: Expected at least one import name', fromTok.lineno, fromTok.colno);
                }
                // Since we are manually advancing past the block end,
                // need to keep track of whitespace control (normally
                // this is done in `advanceAfterBlockEnd`
                if (nextTok.value.charAt(0) === '-') {
                    this.dropLeadingWhitespace = true;
                }
                this.nextToken();
                break;
            }
            if (names.children.length > 0 && !this.skip(lexer_1.default.TOKEN_COMMA)) {
                this.fail('parseFrom: expected comma', fromTok.lineno, fromTok.colno);
            }
            const name = this.parsePrimary();
            if (name.value.charAt(0) === '_') {
                this.fail('parseFrom: names starting with an underscore cannot be imported', name.lineno, name.colno);
            }
            if (this.skipSymbol('as')) {
                const alias = this.parsePrimary();
                names.addChild(new nodes_1.default.Pair(name.lineno, name.colno, name, alias));
            }
            else {
                names.addChild(name);
            }
            withContext = this.parseWithContext();
        }
        return new nodes_1.default.FromImport(fromTok.lineno, fromTok.colno, template, names, withContext);
    }
    parseBlock() {
        const tag = this.peekToken();
        if (!this.skipSymbol('block')) {
            this.fail('parseBlock: expected block', tag.lineno, tag.colno);
        }
        const node = new nodes_1.default.Block(tag.lineno, tag.colno);
        node.name = this.parsePrimary();
        if (!(node.name instanceof nodes_1.default.Symbol)) {
            this.fail('parseBlock: variable name expected', tag.lineno, tag.colno);
        }
        this.advanceAfterBlockEnd(tag.value);
        node.body = this.parseUntilBlocks('endblock');
        this.skipSymbol('endblock');
        this.skipSymbol(node.name.value);
        const tok = this.peekToken();
        if (!tok) {
            this.fail('parseBlock: expected endblock, got end of file');
        }
        this.advanceAfterBlockEnd(tok.value);
        return node;
    }
    parseExtends() {
        const tagName = 'extends';
        const tag = this.peekToken();
        if (!this.skipSymbol(tagName)) {
            this.fail('parseTemplateRef: expected ' + tagName);
        }
        const node = new nodes_1.default.Extends(tag.lineno, tag.colno);
        node.template = this.parseExpression();
        this.advanceAfterBlockEnd(tag.value);
        return node;
    }
    parseInclude() {
        const tagName = 'include';
        const tag = this.peekToken();
        if (!this.skipSymbol(tagName)) {
            this.fail('parseInclude: expected ' + tagName);
        }
        const node = new nodes_1.default.Include(tag.lineno, tag.colno);
        node.template = this.parseExpression();
        if (this.skipSymbol('ignore') && this.skipSymbol('missing')) {
            node.ignoreMissing = true;
        }
        this.advanceAfterBlockEnd(tag.value);
        return node;
    }
    parseIf() {
        const tag = this.peekToken();
        let node;
        if (this.skipSymbol('if') || this.skipSymbol('elif') || this.skipSymbol('elseif')) {
            node = new nodes_1.default.If(tag.lineno, tag.colno);
        }
        else if (this.skipSymbol('ifAsync')) {
            node = new nodes_1.default.IfAsync(tag.lineno, tag.colno);
        }
        else {
            this.fail('parseIf: expected if, elif, or elseif', tag.lineno, tag.colno);
        }
        node.cond = this.parseExpression();
        this.advanceAfterBlockEnd(tag.value);
        node.body = this.parseUntilBlocks('elif', 'elseif', 'else', 'endif');
        const tok = this.peekToken();
        switch (tok && tok.value) {
            case 'elseif':
            case 'elif':
                node.else_ = this.parseIf();
                break;
            case 'else':
                this.advanceAfterBlockEnd();
                node.else_ = this.parseUntilBlocks('endif');
                this.advanceAfterBlockEnd();
                break;
            case 'endif':
                node.else_ = null;
                this.advanceAfterBlockEnd();
                break;
            default:
                this.fail('parseIf: expected elif, else, or endif, got end of file');
        }
        return node;
    }
    parseSet() {
        const tag = this.peekToken();
        if (!this.skipSymbol('set')) {
            this.fail('parseSet: expected set', tag.lineno, tag.colno);
        }
        const node = new nodes_1.default.Set(tag.lineno, tag.colno, []);
        let target;
        while ((target = this.parsePrimary())) {
            node.targets.push(target);
            if (!this.skip(lexer_1.default.TOKEN_COMMA)) {
                break;
            }
        }
        if (!this.skipValue(lexer_1.default.TOKEN_OPERATOR, '=')) {
            if (!this.skip(lexer_1.default.TOKEN_BLOCK_END)) {
                this.fail('parseSet: expected = or block end in set tag', tag.lineno, tag.colno);
            }
            else {
                node.body = new nodes_1.default.Capture(tag.lineno, tag.colno, this.parseUntilBlocks('endset'));
                node.value = null;
                this.advanceAfterBlockEnd();
            }
        }
        else {
            node.value = this.parseExpression();
            this.advanceAfterBlockEnd(tag.value);
        }
        return node;
    }
    parseSwitch() {
        /*
         * Store the tag names in variables in case someone ever wants to
         * customize this.
         */
        const switchStart = 'switch';
        const switchEnd = 'endswitch';
        const caseStart = 'case';
        const caseDefault = 'default';
        // Get the switch tag.
        const tag = this.peekToken();
        // fail early if we get some unexpected tag.
        if (!this.skipSymbol(switchStart)
            && !this.skipSymbol(caseStart)
            && !this.skipSymbol(caseDefault)) {
            this.fail('parseSwitch: expected "switch," "case" or "default"', tag.lineno, tag.colno);
        }
        // parse the switch expression
        const expr = this.parseExpression();
        // advance until a start of a case, a default case or an endswitch.
        this.advanceAfterBlockEnd(switchStart);
        this.parseUntilBlocks(caseStart, caseDefault, switchEnd);
        // this is the first case. it could also be an endswitch, we'll check.
        let tok = this.peekToken();
        // create new variables for our cases and default case.
        const cases = [];
        let defaultCase;
        // while we're dealing with new cases nodes...
        do {
            // skip the start symbol and get the case expression
            this.skipSymbol(caseStart);
            const cond = this.parseExpression();
            this.advanceAfterBlockEnd(switchStart);
            // get the body of the case node and add it to the array of cases.
            const body = this.parseUntilBlocks(caseStart, caseDefault, switchEnd);
            cases.push(new nodes_1.default.Case(tok.line, tok.col, cond, body));
            // get our next case
            tok = this.peekToken();
        } while (tok && tok.value === caseStart);
        // we either have a default case or a switch end.
        switch (tok.value) {
            case caseDefault:
                this.advanceAfterBlockEnd();
                defaultCase = this.parseUntilBlocks(switchEnd);
                this.advanceAfterBlockEnd();
                break;
            case switchEnd:
                this.advanceAfterBlockEnd();
                break;
            default:
                // otherwise bail because EOF
                this.fail('parseSwitch: expected "case," "default" or "endswitch," got EOF.');
        }
        // and return the switch node.
        return new nodes_1.default.Switch(tag.lineno, tag.colno, expr, cases, defaultCase);
    }
    parseStatement() {
        var tok = this.peekToken();
        var node;
        if (tok.type !== lexer_1.default.TOKEN_SYMBOL) {
            this.fail('tag name expected', tok.lineno, tok.colno);
        }
        if (this.breakOnBlocks &&
            lib_1.default.indexOf(this.breakOnBlocks, tok.value) !== -1) {
            return null;
        }
        switch (tok.value) {
            case 'raw':
                return this.parseRaw();
            case 'verbatim':
                return this.parseRaw('verbatim');
            case 'if':
            case 'ifAsync':
                return this.parseIf();
            case 'for':
            case 'asyncEach':
            case 'asyncAll':
                return this.parseFor();
            case 'block':
                return this.parseBlock();
            case 'extends':
                return this.parseExtends();
            case 'include':
                return this.parseInclude();
            case 'set':
                return this.parseSet();
            case 'macro':
                return this.parseMacro();
            case 'call':
                return this.parseCall();
            case 'import':
                return this.parseImport();
            case 'from':
                return this.parseFrom();
            case 'filter':
                return this.parseFilterStatement();
            case 'switch':
                return this.parseSwitch();
            default:
                if (this.extensions.length) {
                    for (let i = 0; i < this.extensions.length; i++) {
                        const ext = this.extensions[i];
                        if (lib_1.default.indexOf(ext.tags || [], tok.value) !== -1) {
                            return ext.parse(this, nodes_1.default, lexer_1.default);
                        }
                    }
                }
                this.fail('unknown block tag: ' + tok.value, tok.lineno, tok.colno);
        }
        return node;
    }
    parseRaw(tagName = undefined) {
        tagName = tagName || 'raw';
        const endTagName = 'end' + tagName;
        // Look for upcoming raw blocks (ignore all other kinds of blocks)
        const rawBlockRegex = new RegExp('([\\s\\S]*?){%\\s*(' + tagName + '|' + endTagName + ')\\s*(?=%})%}');
        let rawLevel = 1;
        let str = '';
        let matches = null;
        // Skip opening raw token
        // Keep this token to track line and column numbers
        const begun = this.advanceAfterBlockEnd();
        // Exit when there's nothing to match
        // or when we've found the matching "endraw" block
        while ((matches = this.tokens._extractRegex(rawBlockRegex)) && rawLevel > 0) {
            const all = matches[0];
            const pre = matches[1];
            const blockName = matches[2];
            // Adjust rawlevel
            if (blockName === tagName) {
                rawLevel += 1;
            }
            else if (blockName === endTagName) {
                rawLevel -= 1;
            }
            // Add to str
            if (rawLevel === 0) {
                // We want to exclude the last "endraw"
                str += pre;
                // Move tokenizer to beginning of endraw block
                this.tokens.backN(all.length - pre.length);
            }
            else {
                str += all;
            }
        }
        return new nodes_1.default.Output(begun.lineno, begun.colno, [new nodes_1.default.TemplateData(begun.lineno, begun.colno, str)]);
    }
    parsePostfix(node) {
        let lookup;
        let tok = this.peekToken();
        while (tok) {
            if (tok.type === lexer_1.default.TOKEN_LEFT_PAREN) {
                // Function call
                node = new nodes_1.default.FunCall(tok.lineno, tok.colno, node, this.parseSignature());
            }
            else if (tok.type === lexer_1.default.TOKEN_LEFT_BRACKET) {
                // Reference
                lookup = this.parseAggregate();
                if (lookup.children.length > 1) {
                    this.fail('invalid index');
                }
                node = new nodes_1.default.LookupVal(tok.lineno, tok.colno, node, lookup.children[0]);
            }
            else if (tok.type === lexer_1.default.TOKEN_OPERATOR && tok.value === '.') {
                // Reference
                this.nextToken();
                const val = this.nextToken();
                if (val.type !== lexer_1.default.TOKEN_SYMBOL) {
                    this.fail('expected name as lookup value, got ' + val.value, val.lineno, val.colno);
                }
                // Make a literal string because it's not a variable
                // reference
                lookup = new nodes_1.default.Literal(val.lineno, val.colno, val.value);
                node = new nodes_1.default.LookupVal(tok.lineno, tok.colno, node, lookup);
            }
            else {
                break;
            }
            tok = this.peekToken();
        }
        return node;
    }
    parseExpression() {
        var node = this.parseInlineIf();
        return node;
    }
    parseInlineIf() {
        let node = this.parseOr();
        if (this.skipSymbol('if')) {
            const condNode = this.parseOr();
            const bodyNode = node;
            node = new nodes_1.default.InlineIf(node.lineno, node.colno);
            node.body = bodyNode;
            node.cond = condNode;
            if (this.skipSymbol('else')) {
                node.else_ = this.parseOr();
            }
            else {
                node.else_ = null;
            }
        }
        return node;
    }
    parseOr() {
        let node = this.parseAnd();
        while (this.skipSymbol('or')) {
            const node2 = this.parseAnd();
            node = new nodes_1.default.Or(node.lineno, node.colno, node, node2);
        }
        return node;
    }
    parseAnd() {
        let node = this.parseNot();
        while (this.skipSymbol('and')) {
            const node2 = this.parseNot();
            node = new nodes_1.default.And(node.lineno, node.colno, node, node2);
        }
        return node;
    }
    parseNot() {
        const tok = this.peekToken();
        if (this.skipSymbol('not')) {
            return new nodes_1.default.Not(tok.lineno, tok.colno, this.parseNot());
        }
        return this.parseIn();
    }
    parseIn() {
        let node = this.parseIs();
        while (1) { // eslint-disable-line no-constant-condition
            // check if the next token is 'not'
            const tok = this.nextToken();
            if (!tok) {
                break;
            }
            const invert = tok.type === lexer_1.default.TOKEN_SYMBOL && tok.value === 'not';
            // if it wasn't 'not', put it back
            if (!invert) {
                this.pushToken(tok);
            }
            if (this.skipSymbol('in')) {
                const node2 = this.parseIs();
                node = new nodes_1.default.In(node.lineno, node.colno, node, node2);
                if (invert) {
                    node = new nodes_1.default.Not(node.lineno, node.colno, node);
                }
            }
            else {
                // if we'd found a 'not' but this wasn't an 'in', put back the 'not'
                if (invert) {
                    this.pushToken(tok);
                }
                break;
            }
        }
        return node;
    }
    // I put this right after "in" in the operator precedence stack. That can
    // obviously be changed to be closer to Jinja.
    parseIs() {
        let node = this.parseCompare();
        // look for an is
        if (this.skipSymbol('is')) {
            // look for a not
            const not = this.skipSymbol('not');
            // get the next node
            const node2 = this.parseCompare();
            // create an Is node using the next node and the info from our Is node.
            node = new nodes_1.default.Is(node.lineno, node.colno, node, node2);
            // if we have a Not, create a Not node from our Is node.
            if (not) {
                node = new nodes_1.default.Not(node.lineno, node.colno, node);
            }
        }
        // return the node.
        return node;
    }
    parseCompare() {
        const compareOps = ['==', '===', '!=', '!==', '<', '>', '<=', '>='];
        const expr = this.parseConcat();
        const ops = [];
        while (1) { // eslint-disable-line no-constant-condition
            const tok = this.nextToken();
            if (!tok) {
                break;
            }
            else if (compareOps.indexOf(tok.value) !== -1) {
                ops.push(new nodes_1.default.CompareOperand(tok.lineno, tok.colno, this.parseConcat(), tok.value));
            }
            else {
                this.pushToken(tok);
                break;
            }
        }
        if (ops.length) {
            return new nodes_1.default.Compare(ops[0].lineno, ops[0].colno, expr, ops);
        }
        else {
            return expr;
        }
    }
    // finds the '~' for string concatenation
    parseConcat() {
        let node = this.parseAdd();
        while (this.skipValue(lexer_1.default.TOKEN_TILDE, '~')) {
            const node2 = this.parseAdd();
            node = new nodes_1.default.Concat(node.lineno, node.colno, node, node2);
        }
        return node;
    }
    parseAdd() {
        let node = this.parseSub();
        while (this.skipValue(lexer_1.default.TOKEN_OPERATOR, '+')) {
            const node2 = this.parseSub();
            node = new nodes_1.default.Add(node.lineno, node.colno, node, node2);
        }
        return node;
    }
    parseSub() {
        let node = this.parseMul();
        while (this.skipValue(lexer_1.default.TOKEN_OPERATOR, '-')) {
            const node2 = this.parseMul();
            node = new nodes_1.default.Sub(node.lineno, node.colno, node, node2);
        }
        return node;
    }
    parseMul() {
        let node = this.parseDiv();
        while (this.skipValue(lexer_1.default.TOKEN_OPERATOR, '*')) {
            const node2 = this.parseDiv();
            node = new nodes_1.default.Mul(node.lineno, node.colno, node, node2);
        }
        return node;
    }
    parseDiv() {
        let node = this.parseFloorDiv();
        while (this.skipValue(lexer_1.default.TOKEN_OPERATOR, '/')) {
            const node2 = this.parseFloorDiv();
            node = new nodes_1.default.Div(node.lineno, node.colno, node, node2);
        }
        return node;
    }
    parseFloorDiv() {
        let node = this.parseMod();
        while (this.skipValue(lexer_1.default.TOKEN_OPERATOR, '//')) {
            const node2 = this.parseMod();
            node = new nodes_1.default.FloorDiv(node.lineno, node.colno, node, node2);
        }
        return node;
    }
    parseMod() {
        let node = this.parsePow();
        while (this.skipValue(lexer_1.default.TOKEN_OPERATOR, '%')) {
            const node2 = this.parsePow();
            node = new nodes_1.default.Mod(node.lineno, node.colno, node, node2);
        }
        return node;
    }
    parsePow() {
        let node = this.parseUnary();
        while (this.skipValue(lexer_1.default.TOKEN_OPERATOR, '**')) {
            const node2 = this.parseUnary();
            node = new nodes_1.default.Pow(node.lineno, node.colno, node, node2);
        }
        return node;
    }
    parseUnary(noFilters = undefined) {
        const tok = this.peekToken();
        let node;
        if (this.skipValue(lexer_1.default.TOKEN_OPERATOR, '-')) {
            node = new nodes_1.default.Neg(tok.lineno, tok.colno, this.parseUnary(true));
        }
        else if (this.skipValue(lexer_1.default.TOKEN_OPERATOR, '+')) {
            node = new nodes_1.default.Pos(tok.lineno, tok.colno, this.parseUnary(true));
        }
        else {
            node = this.parsePrimary();
        }
        if (!noFilters) {
            node = this.parseFilter(node);
        }
        return node;
    }
    parsePrimary(noPostfix = undefined) {
        const tok = this.nextToken();
        let val;
        let node = null;
        if (!tok) {
            this.fail('expected expression, got end of file');
        }
        else if (tok.type === lexer_1.default.TOKEN_STRING) {
            val = tok.value;
        }
        else if (tok.type === lexer_1.default.TOKEN_INT) {
            val = parseInt(tok.value, 10);
        }
        else if (tok.type === lexer_1.default.TOKEN_FLOAT) {
            val = parseFloat(tok.value);
        }
        else if (tok.type === lexer_1.default.TOKEN_BOOLEAN) {
            if (tok.value === 'true') {
                val = true;
            }
            else if (tok.value === 'false') {
                val = false;
            }
            else {
                this.fail('invalid boolean: ' + tok.value, tok.lineno, tok.colno);
            }
        }
        else if (tok.type === lexer_1.default.TOKEN_NONE) {
            val = null;
        }
        else if (tok.type === lexer_1.default.TOKEN_REGEX) {
            val = new RegExp(tok.value.body, tok.value.flags);
        }
        if (val !== undefined) {
            node = new nodes_1.default.Literal(tok.lineno, tok.colno, val);
        }
        else if (tok.type === lexer_1.default.TOKEN_SYMBOL) {
            node = new nodes_1.default.Symbol(tok.lineno, tok.colno, tok.value);
        }
        else {
            // See if it's an aggregate type, we need to push the
            // current delimiter token back on
            this.pushToken(tok);
            node = this.parseAggregate();
        }
        if (!noPostfix) {
            node = this.parsePostfix(node);
        }
        if (node) {
            return node;
        }
        else {
            throw this.error(`unexpected token: ${tok.value}`, tok.lineno, tok.colno);
        }
    }
    parseFilterName() {
        const tok = this.expect(lexer_1.default.TOKEN_SYMBOL);
        let name = tok.value;
        while (this.skipValue(lexer_1.default.TOKEN_OPERATOR, '.')) {
            name += '.' + this.expect(lexer_1.default.TOKEN_SYMBOL).value;
        }
        return new nodes_1.default.Symbol(tok.lineno, tok.colno, name);
    }
    parseFilterArgs(node) {
        if (this.peekToken().type === lexer_1.default.TOKEN_LEFT_PAREN) {
            // Get a FunCall node and add the parameters to the
            // filter
            const call = this.parsePostfix(node);
            return call.args.children;
        }
        return [];
    }
    parseFilter(node) {
        while (this.skip(lexer_1.default.TOKEN_PIPE)) {
            const name = this.parseFilterName();
            node = new nodes_1.default.Filter(name.lineno, name.colno, name, new nodes_1.default.NodeList(name.lineno, name.colno, [node].concat(this.parseFilterArgs(node))));
        }
        return node;
    }
    parseFilterStatement() {
        var filterTok = this.peekToken();
        if (!this.skipSymbol('filter')) {
            this.fail('parseFilterStatement: expected filter');
        }
        const name = this.parseFilterName();
        const args = this.parseFilterArgs(name);
        this.advanceAfterBlockEnd(filterTok.value);
        const body = new nodes_1.default.Capture(name.lineno, name.colno, this.parseUntilBlocks('endfilter'));
        this.advanceAfterBlockEnd();
        const node = new nodes_1.default.Filter(name.lineno, name.colno, name, new nodes_1.default.NodeList(name.lineno, name.colno, [body].concat(args)));
        return new nodes_1.default.Output(name.lineno, name.colno, [node]);
    }
    parseAggregate() {
        var tok = this.nextToken();
        var node;
        switch (tok.type) {
            case lexer_1.default.TOKEN_LEFT_PAREN:
                node = new nodes_1.default.Group(tok.lineno, tok.colno);
                break;
            case lexer_1.default.TOKEN_LEFT_BRACKET:
                node = new nodes_1.default.Array(tok.lineno, tok.colno);
                break;
            case lexer_1.default.TOKEN_LEFT_CURLY:
                node = new nodes_1.default.Dict(tok.lineno, tok.colno);
                break;
            default:
                return null;
        }
        while (1) { // eslint-disable-line no-constant-condition
            const type = this.peekToken().type;
            if (type === lexer_1.default.TOKEN_RIGHT_PAREN ||
                type === lexer_1.default.TOKEN_RIGHT_BRACKET ||
                type === lexer_1.default.TOKEN_RIGHT_CURLY) {
                this.nextToken();
                break;
            }
            if (node.children.length > 0) {
                if (!this.skip(lexer_1.default.TOKEN_COMMA)) {
                    this.fail('parseAggregate: expected comma after expression', tok.lineno, tok.colno);
                }
            }
            if (node instanceof nodes_1.default.Dict) {
                // TODO: check for errors
                const key = this.parsePrimary();
                // We expect a key/value pair for dicts, separated by a
                // colon
                if (!this.skip(lexer_1.default.TOKEN_COLON)) {
                    this.fail('parseAggregate: expected colon after dict key', tok.lineno, tok.colno);
                }
                // TODO: check for errors
                const value = this.parseExpression();
                node.addChild(new nodes_1.default.Pair(key.lineno, key.colno, key, value));
            }
            else {
                // TODO: check for errors
                const expr = this.parseExpression();
                node.addChild(expr);
            }
        }
        return node;
    }
    parseSignature(tolerant = undefined, noParens = undefined) {
        let tok = this.peekToken();
        if (!noParens && tok.type !== lexer_1.default.TOKEN_LEFT_PAREN) {
            if (tolerant) {
                return null;
            }
            else {
                this.fail('expected arguments', tok.lineno, tok.colno);
            }
        }
        if (tok.type === lexer_1.default.TOKEN_LEFT_PAREN) {
            tok = this.nextToken();
        }
        const args = new nodes_1.default.NodeList(tok.lineno, tok.colno);
        const kwargs = new nodes_1.default.KeywordArgs(tok.lineno, tok.colno);
        let checkComma = false;
        while (1) { // eslint-disable-line no-constant-condition
            tok = this.peekToken();
            if (!noParens && tok.type === lexer_1.default.TOKEN_RIGHT_PAREN) {
                this.nextToken();
                break;
            }
            else if (noParens && tok.type === lexer_1.default.TOKEN_BLOCK_END) {
                break;
            }
            if (checkComma && !this.skip(lexer_1.default.TOKEN_COMMA)) {
                this.fail('parseSignature: expected comma after expression', tok.lineno, tok.colno);
            }
            else {
                const arg = this.parseExpression();
                if (this.skipValue(lexer_1.default.TOKEN_OPERATOR, '=')) {
                    kwargs.addChild(new nodes_1.default.Pair(arg.lineno, arg.colno, arg, this.parseExpression()));
                }
                else {
                    args.addChild(arg);
                }
            }
            checkComma = true;
        }
        if (kwargs.children.length) {
            args.addChild(kwargs);
        }
        return args;
    }
    parseUntilBlocks(...blockNames) {
        const prev = this.breakOnBlocks;
        this.breakOnBlocks = blockNames;
        const ret = this.parse();
        this.breakOnBlocks = prev;
        return ret;
    }
    parseNodes() {
        let tok;
        const buf = [];
        while ((tok = this.nextToken())) {
            if (tok.type === lexer_1.default.TOKEN_DATA) {
                let data = tok.value;
                const nextToken = this.peekToken();
                const nextVal = nextToken && nextToken.value;
                // If the last token has "-" we need to trim the
                // leading whitespace of the data. This is marked with
                // the `dropLeadingWhitespace` variable.
                if (this.dropLeadingWhitespace) {
                    // TODO: this could be optimized (don't use regex)
                    data = data.replace(/^\s*/, '');
                    this.dropLeadingWhitespace = false;
                }
                // Same for the succeeding block start token
                if (nextToken &&
                    ((nextToken.type === lexer_1.default.TOKEN_BLOCK_START &&
                        nextVal.charAt(nextVal.length - 1) === '-') ||
                        (nextToken.type === lexer_1.default.TOKEN_VARIABLE_START &&
                            nextVal.charAt(this.tokens.tags.VARIABLE_START.length)
                                === '-') ||
                        (nextToken.type === lexer_1.default.TOKEN_COMMENT &&
                            nextVal.charAt(this.tokens.tags.COMMENT_START.length)
                                === '-'))) {
                    // TODO: this could be optimized (don't use regex)
                    data = data.replace(/\s*$/, '');
                }
                buf.push(new nodes_1.default.Output(tok.lineno, tok.colno, [new nodes_1.default.TemplateData(tok.lineno, tok.colno, data)]));
            }
            else if (tok.type === lexer_1.default.TOKEN_BLOCK_START) {
                this.dropLeadingWhitespace = false;
                const n = this.parseStatement();
                if (!n) {
                    break;
                }
                buf.push(n);
            }
            else if (tok.type === lexer_1.default.TOKEN_VARIABLE_START) {
                const e = this.parseExpression();
                this.dropLeadingWhitespace = false;
                this.advanceAfterVariableEnd();
                buf.push(new nodes_1.default.Output(tok.lineno, tok.colno, [e]));
            }
            else if (tok.type === lexer_1.default.TOKEN_COMMENT) {
                this.dropLeadingWhitespace = tok.value.charAt(tok.value.length - this.tokens.tags.COMMENT_END.length - 1) === '-';
            }
            else {
                // Ignore comments, otherwise this should be an error
                this.fail('Unexpected token at top-level: ' +
                    tok.type, tok.lineno, tok.colno);
            }
        }
        return buf;
    }
    parse() {
        return new nodes_1.default.NodeList(0, 0, this.parseNodes());
    }
    parseAsRoot() {
        return new nodes_1.default.Root(0, 0, this.parseNodes());
    }
}
exports.Parser = Parser;
// var util = require('util');
// var l = lexer.lex('{%- if x -%}\n hello {% endif %}');
// var t;
// while((t = l.nextToken())) {
//     console.log(util.inspect(t));
// }
// var p = new Parser(lexer.lex('hello {% filter title %}' +
//                              'Hello madam how are you' +
//                              '{% endfilter %}'));
// var n = p.parseAsRoot();
// nodes.printNodes(n);
function parse(src, extensions, opts) {
    var p = new Parser(lexer_1.default.lex(src, opts));
    if (extensions !== undefined)
        p.extensions = extensions;
    return p.parseAsRoot();
}
exports.default = {
    parse: parse,
    Parser: Parser
};
//# sourceMappingURL=parser.js.map