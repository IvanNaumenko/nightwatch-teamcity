'use strict';

var tsm = require('teamcity-service-messages');

function escapeTeamCityMessage(str) {
    if (!str) {
        return '';
    }

    return str.toString().replace(/\|/g, '||')
        .replace(/\'/g, '|\'')
        .replace(/\n/g, '|n')
        .replace(/\r/g, '|r')
        .replace(/\u0085/g, '|x') // TeamCity 6
        .replace(/\u2028/g, '|l') // TeamCity 6
        .replace(/\u2029/g, '|p') // TeamCity 6
        .replace(/\[/g, '|[')
        .replace(/\]/g, '|]');
}

function formatTestSuite(name, results) {
    const escapedTestSuitename = escapeTeamCityMessage(name);
    const completed = results.completed;
    const skipped = results.skipped;

    console.log(`##teamcity[testSuiteStarted name='${escapedTestSuitename}']`);

    Object.keys(completed).forEach( testName => formatTest(testName, completed[testName]) );

    skipped.forEach( testName => tsm.testIgnored({ name: testName}));

    console.log(`##teamcity[testSuiteFinished name='${escapedTestSuitename}']`);
}

function formatTest(name, result) {
    const escapedTestName = escapeTeamCityMessage(name);
    const assertions = result.assertions;
    const time = parseFloat(result.time) * 1000;

    console.log(`##teamcity[testStarted name='${escapedTestName}' captureStandardOutput='true']`);

    assertions.forEach((assert, i) => {
        const assertText = escapeTeamCityMessage(`${assert.message} (${i})`);

        console.log(`##teamcity[testStdOut name='${escapedTestName}' out='${assertText}']`);

        if (assert.failure) {
            console.log(`##teamcity[testFailed name='${escapedTestName}' message='${assertText}' details='${escapeTeamCityMessage(`${assert.fullMsg}\n${assert.stackTrace}`)}']`);
        }
    });

    console.log(`##teamcity[testFinished name='${escapedTestName}' duration='${time}']`);
}

module.exports = {
    write(result, options, done) {
        const testSuites = result.modules;

        Object.keys(testSuites).forEach( name => formatTestSuite(name, testSuites[name]) );

        done();
    }
};
