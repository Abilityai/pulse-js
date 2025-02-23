export class BaseLLMMessage {
  constructor(content, tags = []) {
    this.content = content;
    this.tags = tags;
  }

  toString() {
    return `<${this.constructor.name} (content=${this.content}, tags=${this.tags})>`;
  }

  clone(overrides = {}) {
    return new this.constructor(this.content, { ...overrides });
  }

  toJSON() {
    return {
      role: this.role,
      content: this.content,
      tags: this.tags
    };
  }

  dump() {
    return {
      role: this.role,
      content: this.content,
      tags: this.tags
    };
  }
}
