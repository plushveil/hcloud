# hcloud

A tool to manage resources on Hetzner Cloud using a customizable configuration file (hcloud.yml).

[![.github/workflows/test.yml](https://github.com/plushveil/hcloud/actions/workflows/test.yml/badge.svg)](https://github.com/plushveil/hcloud/actions/workflows/test.yml)



## Table of Contents

- [Features](#features)
- [Usage](#usage)
  - [Inputs](#inputs)
  - [Environment Variables](#environment-variables)
- [Schema](#schema)
- [License](#license)



## Features

* GitHub Action to automate the deployment of resources.
* YAML-based configuration that describes the resources and services to deploy.
* Wildcard support for the configuration file to deploy multiple image tags.
* Variable substitution in the configuration file, via `${VAR_NAME}` syntax.



## Usage

A workflow file (e.g. `.github/workflows/deploy.yml`) should include the following step to deploy resources on Hetzner Cloud.

```yaml
steps:
  - name: Deploy resources
    uses: plushveil/hcloud@latest
    with:
      config: ./hcloud.yml
    env:
      HCLOUD_TOKEN: ${{ secrets.HCLOUD_TOKEN }}
```


### Inputs

| Name     | Description                    | Default        |
| -------- | ------------------------------ |--------------- |
| `config` | Path to the configuration file | `./hcloud.yml` |


### Environment Variables

| Name              | Description                          |
| ----------------- | ------------------------------------ |
| `HCLOUD_TOKEN`    | Hetzner Cloud API token              |
| `GITHUB_ACTOR`    | GitHub username or organization name |
| `GITHUB_REF_NAME` | GitHub branch or tag name            |
| `GITHUB_TOKEN`    | GitHub token for GHCR access         |

Additionally you may want to pass other environment variables to the services you deploy.
You can define these in the configuration file under the `environment` key.

```yaml
services:
  "<service_name>":
    environment:
      EXAMPLE: "${env.EXAMPLE}"
```



## Schema

This project includes the schema definition ([hcloud.schema.json](../hcloud.schema.json)) to validate the structure of your configuration.
Here’s the schema formatted directly in YAML for a more readable and copyable format:

```yaml	
# hcloud.yml schema

servers:
  "<server_name>":
    server_type: "<string>"            # Type of server
    location: "<string>"               # Location of server
    ssh_keys:                          # Array of SSH key names
      - "<string>"
    environment:                       # Environment variables
      "<key>": "<string>"
    services:                          # Array of services
      - "<string>"
    volumes:                           # Array of volume names
      - "<string>"

services:
  "<service_name>":
    images:                            # Array of container images
      - "<string>"
    ports:                             # Array of ports
      - "<string | number>"
    uris:                              # Array of URIs
      - "<string>"
    volumes:                           # Array of volumes
      - "<string>"
    environment:                       # Environment variables
      "<key>": "<string>"

ssh_keys:
  "<key_name>":
    user: "<string>"                   # Username for SSH key
    private_key: "<string>"            # Private key content
    public_key: "<string>"             # Public key content

volumes:
  "<volume_name>":
    size: "<string | number>"          # Size of the volume
    path: "<string>"                   # Mount path
```



## License

See the [LICENSE](../LICENSE) file for license rights.
