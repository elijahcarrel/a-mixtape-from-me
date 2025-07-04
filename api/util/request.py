from fastapi import Request

def get_domain(request: Request):
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or "localhost:8000"
    print(f"Host: {host}")

    scheme = request.headers.get("x-forwarded-proto") or "http"
    print(f"Scheme: {scheme}")

    domain = f"{scheme}://{host}"
    print(f"Domain: {domain}")
    return str(domain)