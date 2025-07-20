import argparse
import sys
import os
import json
import yaml
from fastapi.openapi.utils import get_openapi

# Add the project root to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app_factory import create_app
from scripts.openapi_utils import strip_openapi_31_incompatibilities

app = create_app()

parser = argparse.ArgumentParser()
parser.add_argument('--output', default='openapi.json', help='Output file for generated OpenAPI schema')
parser.add_argument('--format', default='json', help='Output format for generated OpenAPI schema', choices=['yaml', 'json'])
parser.add_argument('--strip-modern-openapi-incompatibilities', action='store_true', 
                    help='Strip OpenAPI 3.1.0 incompatibilities for better tool compatibility')
args = parser.parse_args()

openapi_spec = get_openapi(
    title=app.title,
    version=app.version,
    openapi_version=app.openapi_version,
    description=app.description,
    routes=app.routes,
)

# Strip OpenAPI 3.1.0 incompatibilities if requested
if args.strip_modern_openapi_incompatibilities:
    openapi_spec = strip_openapi_31_incompatibilities(openapi_spec)

with open(args.output, 'w') as f:
    if args.format == "yaml":
        yaml.dump(openapi_spec, f)
    elif args.format == "json":
        json.dump(openapi_spec, f, indent=4)
    else:
        raise Exception(f"Invalid format {args.format}")