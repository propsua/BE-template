module.exports = {
  normalize,
};

function normalize(data) {
  const replacer = (key, value) => (value !== null ? value : undefined);
  const process = (value) => JSON.parse(JSON.stringify(value, replacer));

  return Array.isArray(data) ? data.map(process) : process(data);
}
