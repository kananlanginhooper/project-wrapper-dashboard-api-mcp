"""Write the API's OpenAPI document to stdout; the UI generates its TypeScript types from it (npm run api-types)."""

import json

from app.main import create_app

if __name__ == "__main__":
    print(json.dumps(create_app().openapi(), indent=2))
