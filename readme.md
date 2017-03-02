# Spark Editor Backend [![Build Status](https://travis-ci.org/sparkeditor/backend.svg?branch=master)](https://travis-ci.org/sparkeditor/backend)
This is the backend for the [Spark editor](https://sparkeditor.github.io). Spark is an open source, self hosted solution for collaborative programming. It allows multiple programmers to work on the same file or project, giving Google Docs-style realtime updates as edits are made. The backend is responsible for synchronizing every client's open buffers reading/writing to the filesystem.

The editor itself is [a work in progress](https://github.com/sparkeditor/webapp).

## Architecture Overview
The Spark editor has two parts: the backend (this repo), which synchronizes connected clients, and the web application, which consists of a web server and a JavaScript app. This division was made to allow multiple types of clients in the future - for example, plugins for existing editors could connect to the same Spark backend.

This space will be updated with hosting instructions when the web application is ready. Until then, the backend isn't very useful.

## Backend Data Structures
The backend keeps track of projects and users. A project is defined by project files, a unique name and optionally, a root directory. Under the hood, Spark keeps all project files in `~/.spark/projects`, and will create a symlink to the root directory if it is specified. Users have access levels to projects - either no access, read-only access, contributor access, or admin access. These access levels define what actions that user can perform on the project. Eventually, there will be a nice dashboard interface for the sysadmin to configure projects and users, but for now the `spark` command offers the same functionality.

## Installation and Usage

    $ npm install -g spark-backend
    $ spark
    
## Command Line Reference
Until the dashboard interface is built, you'll have to use the `spark` subcommands to create and delete projects and users. These commands include:

    Usage: spark [options] [command]
      
      
    Commands:
        
    start [port]  starts the Spark server
    mkuser        makes a new user
    rmuser        removes a user
    mkproject     makes a new Spark project
    rmproject     removes a Spark project
    setaccess     sets a user's access level to a project
    lsusers       lists users
    lsprojects    lists projects
    help [cmd]    display help for [cmd]
    
    Options:
    
    -h, --help     output usage information
    -V, --version  output the version number
                                                      
