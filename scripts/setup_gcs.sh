#!/bin/bash

# Script to configure the Google Cloud Storage Bucket for FAQ Hosting

BUCKET_NAME="<BUCKET_NAME>"

echo "Setting up bucket: gs://$BUCKET_NAME"

# a) Create the bucket in us-central1
gsutil mb -l us-central1 gs://$BUCKET_NAME

# b) Set CORS using the cors-config.json file
gsutil cors set cors-config.json gs://$BUCKET_NAME

# c) Make objects publicly readable
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

echo "Bucket configuration complete."
