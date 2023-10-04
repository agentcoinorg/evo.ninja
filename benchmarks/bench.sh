#!/bin/bash

# Ensure you have GNU parallel installed
if ! command -v parallel >/dev/null; then
    echo "Please install GNU parallel first."
    exit 1
fi

# Get the number of jobs from the command line argument (default to 1 if not provided)
NUM_JOBS="${1:-1}"

# Run each command in parallel and log its output to a corresponding log file
parallel --jobs "$NUM_JOBS" --results logs/ "{}" :::: commands.txt
