function tool(schema, handler) {
  return {
    name: schema.name,
    toJSON() {
      return schema;
    },
    async call(args) {
      return await handler(args);
    }
  };
}

export { tool };
