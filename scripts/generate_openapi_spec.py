import argparse
import sys
import os
import yaml
from fastapi.openapi.utils import get_openapi

# Add the project root to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app_factory import create_app

app = create_app()

parser = argparse.ArgumentParser()
parser.add_argument('--output', default='openapi.yaml', help='Output file for generated OpenAPI schema')
args = parser.parse_args()

openapi_spec = get_openapi(
    title=app.title,
    version=app.version,
    openapi_version=app.openapi_version,
    description=app.description,
    routes=app.routes,
)

with open(args.output, 'w') as f:
    yaml.dump(openapi_spec, f)