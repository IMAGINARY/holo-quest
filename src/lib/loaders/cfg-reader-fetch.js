export default function CfgReaderFetch(filename) {
  return fetch(filename, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return response.text();
    });
}
