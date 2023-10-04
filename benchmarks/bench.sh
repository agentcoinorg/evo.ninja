#!/bin/bash

# Ensure you have GNU parallel installed
if ! command -v parallel >/dev/null; then
    echo "Please install GNU parallel first."
    exit 1
fi

# Run each command in parallel and log its output to a corresponding log file
parallel --jobs 5 --results logs/ "{}" :::: commands.txt