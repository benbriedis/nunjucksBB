import * as lib from '../runtime/lib';

const whitespaceChars = ' \n\t\r\u00A0';
const delimChars = '()[]{}%*-+~/#,:|.<>=!';
const intChars = '0123456789';

const BLOCK_START = '{%';
const BLOCK_END = '%}';
const VARIABLE_START = '{{';
const VARIABLE_END = '}}';
const COMMENT_START = '{#';
const COMMENT_END = '#}';

export const TOKEN_STRING = 'string';
export const TOKEN_WHITESPACE = 'whitespace';
export const TOKEN_DATA = 'data';
export const TOKEN_BLOCK_START = 'block-start';
export const TOKEN_BLOCK_END = 'block-end';
export const TOKEN_VARIABLE_START = 'variable-start';
export const TOKEN_VARIABLE_END = 'variable-end';
export const TOKEN_COMMENT = 'comment';
export const TOKEN_LEFT_PAREN = 'left-paren';
export const TOKEN_RIGHT_PAREN = 'right-paren';
export const TOKEN_LEFT_BRACKET = 'left-bracket';
export const TOKEN_RIGHT_BRACKET = 'right-bracket';
export const TOKEN_LEFT_CURLY = 'left-curly';
export const TOKEN_RIGHT_CURLY = 'right-curly';
export const TOKEN_OPERATOR = 'operator';
export const TOKEN_COMMA = 'comma';
export const TOKEN_COLON = 'colon';
export const TOKEN_TILDE = 'tilde';
export const TOKEN_PIPE = 'pipe';
export const TOKEN_INT = 'int';
export const TOKEN_FLOAT = 'float';
export const TOKEN_BOOLEAN = 'boolean';
export const TOKEN_NONE = 'none';
export const TOKEN_SYMBOL = 'symbol';
export const TOKEN_SPECIAL = 'special';
export const TOKEN_REGEX = 'regex';


function token(type, value, lineno, colno) 
{
	return {
		type: type,
		value: value,
		lineno: lineno,
		colno: colno
	};
}

export class Tokenizer 
{
	str:string;
	index:number = 0;
	len:number;
	lineno:number = 0;
	colno:number = 0;
	in_code:boolean = false;
	tags;
	trimBlocks:boolean;
	lstripBlocks:boolean;

	constructor(str, opts) 
	{
		this.str = str;
		this.len = str.length;

		this.in_code = false;

		opts = opts || {};

		let tags = opts.tags || {};
		this.tags = {
			BLOCK_START: tags.blockStart || BLOCK_START,
			BLOCK_END: tags.blockEnd || BLOCK_END,
			VARIABLE_START: tags.variableStart || VARIABLE_START,
			VARIABLE_END: tags.variableEnd || VARIABLE_END,
			COMMENT_START: tags.commentStart || COMMENT_START,
			COMMENT_END: tags.commentEnd || COMMENT_END
		};

		this.trimBlocks = !!opts.trimBlocks;
		this.lstripBlocks = !!opts.lstripBlocks;
	}

	nextToken() {
		let lineno = this.lineno;
		let colno = this.colno;
		let tok;

		if (this.in_code) {
			// Otherwise, if we are in a block parse it as code
			let cur = this.current();

			if (this.isFinished()) {
				// We have nothing else to parse
				return null;
			} else if (cur === '"' || cur === '\'') {
				// We've hit a string
				return token(TOKEN_STRING, this._parseString(cur), lineno, colno);
			} else if ((tok = this._extract(whitespaceChars))) {
				// We hit some whitespace
				return token(TOKEN_WHITESPACE, tok, lineno, colno);
			} else if ((tok = this._extractString(this.tags.BLOCK_END)) ||
				(tok = this._extractString('-' + this.tags.BLOCK_END))) {
				// Special check for the block end tag
				//
				// It is a requirement that start and end tags are composed of
				// delimiter characters (%{}[] etc), and our code always
				// breaks on delimiters so we can assume the token parsing
				// doesn't consume these elsewhere
				this.in_code = false;
				if (this.trimBlocks) {
					cur = this.current();
					if (cur === '\n') {
						// Skip newline
						this.forward();
					} else if (cur === '\r') {
						// Skip CRLF newline
						this.forward();
						cur = this.current();
						if (cur === '\n') {
							this.forward();
						} else {
							// Was not a CRLF, so go back
							this.back();
						}
					}
				}
				return token(TOKEN_BLOCK_END, tok, lineno, colno);
			} else if ((tok = this._extractString(this.tags.VARIABLE_END)) ||
				(tok = this._extractString('-' + this.tags.VARIABLE_END))) {
				// Special check for variable end tag (see above)
				this.in_code = false;
				return token(TOKEN_VARIABLE_END, tok, lineno, colno);
			} else if (cur === 'r' && this.str.charAt(this.index + 1) === '/') {
				// Skip past 'r/'.
				this.forwardN(2);

				// Extract until the end of the regex -- / ends it, \/ does not.
				let regexBody = '';
				while (!this.isFinished()) {
					if (this.current() === '/' && this.previous() !== '\\') {
						this.forward();
						break;
					} else {
						regexBody += this.current();
						this.forward();
					}
				}

				// Check for flags.
				// The possible flags are according to https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
				let POSSIBLE_FLAGS = ['g', 'i', 'm', 'y'];
				let regexFlags = '';
				while (!this.isFinished()) {
					let isCurrentAFlag = POSSIBLE_FLAGS.indexOf(this.current()) !== -1;
					if (isCurrentAFlag) {
						regexFlags += this.current();
						this.forward();
					} else {
						break;
					}
				}

				return token(TOKEN_REGEX, {
					body: regexBody,
					flags: regexFlags
				}, lineno, colno);
			} else if (delimChars.indexOf(cur) !== -1) {
				// We've hit a delimiter (a special char like a bracket)
				this.forward();
				let complexOps = ['==', '===', '!=', '!==', '<=', '>=', '//', '**'];
				let curComplex = cur + this.current();
				let type;

				if (lib.indexOf(complexOps, curComplex) !== -1) {
					this.forward();
					cur = curComplex;

					// See if this is a strict equality/inequality comparator
					if (lib.indexOf(complexOps, curComplex + this.current()) !== -1) {
						cur = curComplex + this.current();
						this.forward();
					}
				}

				switch (cur) {
					case '(':
						type = TOKEN_LEFT_PAREN;
						break;
					case ')':
						type = TOKEN_RIGHT_PAREN;
						break;
					case '[':
						type = TOKEN_LEFT_BRACKET;
						break;
					case ']':
						type = TOKEN_RIGHT_BRACKET;
						break;
					case '{':
						type = TOKEN_LEFT_CURLY;
						break;
					case '}':
						type = TOKEN_RIGHT_CURLY;
						break;
					case ',':
						type = TOKEN_COMMA;
						break;
					case ':':
						type = TOKEN_COLON;
						break;
					case '~':
						type = TOKEN_TILDE;
						break;
					case '|':
						type = TOKEN_PIPE;
						break;
					default:
						type = TOKEN_OPERATOR;
				}

				return token(type, cur, lineno, colno);
			} else {
				// We are not at whitespace or a delimiter, so extract the
				// text and parse it
				tok = this._extractUntil(whitespaceChars + delimChars);

				if (tok.match(/^[-+]?[0-9]+$/)) {
					if (this.current() === '.') {
						this.forward();
						let dec = this._extract(intChars);
						return token(TOKEN_FLOAT, tok + '.' + dec, lineno, colno);
					} else {
						return token(TOKEN_INT, tok, lineno, colno);
					}
				} else if (tok.match(/^(true|false)$/)) {
					return token(TOKEN_BOOLEAN, tok, lineno, colno);
				} else if (tok === 'none') {
					return token(TOKEN_NONE, tok, lineno, colno);
					/*
					 * Added to make the test `null is null` evaluate truthily.
					 * Otherwise, Nunjucks will look up null in the context and
					 * return `undefined`, which is not what we want. This *may* have
					 * consequences is someone is using null in their templates as a
					 * variable.
					 */
				} else if (tok === 'null') {
					return token(TOKEN_NONE, tok, lineno, colno);
				} else if (tok) {
					return token(TOKEN_SYMBOL, tok, lineno, colno);
				} else {
					throw new Error('Unexpected value while parsing: ' + tok);
				}
			}
		} else {
			// Parse out the template text, breaking on tag
			// delimiters because we need to look for block/variable start
			// tags (don't use the full delimChars for optimization)
			let beginChars = (this.tags.BLOCK_START.charAt(0) +
				this.tags.VARIABLE_START.charAt(0) +
				this.tags.COMMENT_START.charAt(0) +
				this.tags.COMMENT_END.charAt(0));

			if (this.isFinished()) {
				return null;
			} else if ((tok = this._extractString(this.tags.BLOCK_START + '-')) ||
				(tok = this._extractString(this.tags.BLOCK_START))) {
				this.in_code = true;
				return token(TOKEN_BLOCK_START, tok, lineno, colno);
			} else if ((tok = this._extractString(this.tags.VARIABLE_START + '-')) ||
				(tok = this._extractString(this.tags.VARIABLE_START))) {
				this.in_code = true;
				return token(TOKEN_VARIABLE_START, tok, lineno, colno);
			} else {
				tok = '';
				let data;
				let inComment = false;

				if (this._matches(this.tags.COMMENT_START)) {
					inComment = true;
					tok = this._extractString(this.tags.COMMENT_START);
				}

				// Continually consume text, breaking on the tag delimiter
				// characters and checking to see if it's a start tag.
				//
				// We could hit the end of the template in the middle of
				// our looping, so check for the null return value from
				// _extractUntil
				while ((data = this._extractUntil(beginChars)) !== null) {
					tok += data;

					if ((this._matches(this.tags.BLOCK_START) ||
							this._matches(this.tags.VARIABLE_START) ||
							this._matches(this.tags.COMMENT_START)) &&
						!inComment) {
						if (this.lstripBlocks &&
							this._matches(this.tags.BLOCK_START) &&
							this.colno > 0 &&
							this.colno <= tok.length) {
							let lastLine = tok.slice(-this.colno);
							if (/^\s+$/.test(lastLine)) {
								// Remove block leading whitespace from beginning of the string
								tok = tok.slice(0, -this.colno);
								if (!tok.length) {
									// All data removed, collapse to avoid unnecessary nodes
									// by returning next token (block start)
									return this.nextToken();
								}
							}
						}
						// If it is a start tag, stop looping
						break;
					} else if (this._matches(this.tags.COMMENT_END)) {
						if (!inComment) {
							throw new Error('unexpected end of comment');
						}
						tok += this._extractString(this.tags.COMMENT_END);
						break;
					} else {
						// It does not match any tag, so add the character and
						// carry on
						tok += this.current();
						this.forward();
					}
				}

				if (data === null && inComment) {
					throw new Error('expected end of comment, got end of file');
				}

				return token(inComment ? TOKEN_COMMENT : TOKEN_DATA,
					tok,
					lineno,
					colno);
			}
		}
	}

	_parseString(delimiter) {
		this.forward();

		let str = '';

		while (!this.isFinished() && this.current() !== delimiter) {
			let cur = this.current();

			if (cur === '\\') {
				this.forward();
				switch (this.current()) {
					case 'n':
						str += '\n';
						break;
					case 't':
						str += '\t';
						break;
					case 'r':
						str += '\r';
						break;
					default:
						str += this.current();
				}
				this.forward();
			} else {
				str += cur;
				this.forward();
			}
		}

		this.forward();
		return str;
	}

	_matches(str) {
		if (this.index + str.length > this.len) {
			return null;
		}

		let m = this.str.slice(this.index, this.index + str.length);
		return m === str;
	}

	_extractString(str) {
		if (this._matches(str)) {
			this.forwardN(str.length);
			return str;
		}
		return null;
	}

	_extractUntil(charString) {
		// Extract all non-matching chars, with the default matching set
		// to everything
		return this._extractMatching(true, charString || '');
	}

	_extract(charString) {
		// Extract all matching chars (no default, so charString must be
		// explicit)
		return this._extractMatching(false, charString);
	}

	_extractMatching(breakOnMatch, charString) {
		// Pull out characters until a breaking char is hit.
		// If breakOnMatch is false, a non-matching char stops it.
		// If breakOnMatch is true, a matching char stops it.

		if (this.isFinished()) {
			return null;
		}

		let first = charString.indexOf(this.current());

		// Only proceed if the first character doesn't meet our condition
		if ((breakOnMatch && first === -1) ||
			(!breakOnMatch && first !== -1)) {
			let t = this.current();
			this.forward();

			// And pull out all the chars one at a time until we hit a
			// breaking char
			let idx = charString.indexOf(this.current());

			while (((breakOnMatch && idx === -1) ||
					(!breakOnMatch && idx !== -1)) && !this.isFinished()) {
				t += this.current();
				this.forward();

				idx = charString.indexOf(this.current());
			}

			return t;
		}

		return '';
	}

	_extractRegex(regex) {
		let matches = this.currentStr().match(regex);
		if (!matches) {
			return null;
		}

		// Move forward whatever was matched
		this.forwardN(matches[0].length);

		return matches;
	}

	isFinished() {
		return this.index >= this.len;
	}

	forwardN(n) {
		for (let i = 0; i < n; i++) {
			this.forward();
		}
	}

	forward() {
		this.index++;

		if (this.previous() === '\n') {
			this.lineno++;
			this.colno = 0;
		} else {
			this.colno++;
		}
	}

	backN(n) {
		for (let i = 0; i < n; i++) {
			this.back();
		}
	}

	back() {
		this.index--;

		if (this.current() === '\n') {
			this.lineno--;

			let idx = this.str.lastIndexOf('\n', this.index - 1);
			if (idx === -1) {
				this.colno = this.index;
			} else {
				this.colno = this.index - idx;
			}
		} else 
			this.colno--;
	}

	// current returns current character
	current() {
		if (!this.isFinished()) {
			return this.str.charAt(this.index);
		}
		return '';
	}

	// currentStr returns what's left of the unparsed string
	currentStr() {
		if (!this.isFinished()) {
			return this.str.substr(this.index);
		}
		return '';
	}

	previous() {
		return this.str.charAt(this.index - 1);
	}
}

export function lex(src, opts=undefined) 
{
	return new Tokenizer(src, opts);
}

