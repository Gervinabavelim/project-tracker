export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error("Network error: could not reach server");
  }

  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}
