#!/usr/bin/env node
/**
 * Created with JetBrains WebStorm.
 * User: smile
 * Date: 14/06/13
 * Time: 15:45
 * To change this template use File | Settings | File Templates.
 */

var config = require('../lib/Config'),
    web = require('../lib/Web'),
    pack = require('../package'),
    program = require('commander'),
    fs = require('fs'),
    log = require('debug')('pushserver:log'),
    errlog = require('debug')('pushserver:error'),
    path = require('path');

program.version(pack.version)
    .option("-c --config <configPath>", "Path to config file")
    .option("-d --dry-run", "Dry run will not send any notifications, just log them")
    .parse(process.argv);

var configPath = program.config;
if (configPath) {
    configPath = configPath.indexOf('/') === 0 ? configPath : path.join(process.cwd(), configPath);
    if (!fs.existsSync(configPath)) {
        errlog('The configuration file doesn\'t exist.');
        return program.outputHelp();
    }
} else {
    errlog('You must provide a configuration file.');
    return program.outputHelp();
}

var configOverrides = {};
if (program.dryRun) {
    configOverrides.dryRun = true;
}
config.initialize(configPath, configOverrides);
web.start();