import argparse
import sys
import os
import json
import yaml
from fastapi.openapi.utils import get_openapi

# Add the project root to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app_factory import create_app

def strip_openapi_31_incompatibilities(spec):
    """
    Strip OpenAPI 3.1.0 specific fields that are incompatible with OpenAPI 3.0.x
    This is needed for tools like oasdiff that only support OpenAPI 3.0.x
    """
    if isinstance(spec, dict):
        # Remove exclusiveMinimum and exclusiveMaximum fields
        spec.pop('exclusiveMinimum', None)
        spec.pop('exclusiveMaximum', None)
        
        # Recursively process all values
        for key, value in spec.items():
            spec[key] = strip_openapi_31_incompatibilities(value)
    elif isinstance(spec, list):
        # Recursively process all items in lists
        return [strip_openapi_31_incompatibilities(item) for item in spec]
    
    return spec

app = create_app()

parser = argparse.ArgumentParser()
parser.add_argument('--output', default='openapi.yaml', help='Output file for generated OpenAPI schema')
parser.add_argument('--format', default='yaml', help='Output format for generated OpenAPI schema', choices=['yaml', 'json'])
args = parser.parse_args()

openapi_spec = get_openapi(
    title=app.title,
    version=app.version,
    openapi_version=app.openapi_version,
    description=app.description,
    routes=app.routes,
)

# Strip OpenAPI 3.1.0 incompatibilities for better tool compatibility
openapi_spec = strip_openapi_31_incompatibilities(openapi_spec)

with open(args.output, 'w') as f:
    if args.format == "yaml":
        yaml.dump(openapi_spec, f)
    elif args.format == "json":
        json.dump(openapi_spec, f, indent=4)
    else:
        raise Exception(f"Invalid format {args.format}")