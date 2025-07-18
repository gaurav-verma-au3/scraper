function getQueryParams(urlString) {
  try {
    const url = new URL(urlString);
    return Object.fromEntries(url.searchParams.entries());
  } catch (err) {
    console.error("Invalid URL:", err.message);
    return {};
  }
}

export default getQueryParams;
