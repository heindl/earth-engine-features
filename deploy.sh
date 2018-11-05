#!/usr/bin/env bash

MOD="$( cd "$(dirname "$0")" ; pwd -P )"

DOTENV="$MOD/.env"
eval "$(echo $(cat "$DOTENV"))"

DEPLOYED_KEY_FILE="$MOD/build/main/lib/utils/keyfile.json"

cp "$GOOGLE_APPLICATION_CREDENTIALS" "$DEPLOYED_KEY_FILE"

gcloud beta functions deploy geographql --memory=128MB  --runtime=nodejs8 --trigger-http --set-env-vars GOOGLE_APPLICATION_CREDENTIALS="./keyfile.json"

rm "$DEPLOYED_KEY_FILE"