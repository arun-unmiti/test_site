// jest.config.js
module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^leaflet$': '<rootDir>/node_modules/leaflet/dist/leaflet.js',
        '^d3$': '<rootDir>/node_modules/d3/dist/d3.min.js',
        '^topojson$': '<rootDir>/node_modules/topojson/dist/topojson.min.js',
        '^@app/(.*)$': '<rootDir>/src/app/$1',
        '^src/(.*)$': '<rootDir>/src/$1',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!d3.*|internmap|delaunator|robust-predicates|@angular/.*)',
    ],
    testEnvironmentOptions: {
        url: 'http://localhost/'
    },
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    coverageDirectory: '<rootDir>/coverage',
    collectCoverage: true,
    verbose: true,
    reporters: [
        'default',
        ['jest-junit', {
            outputDirectory: '<rootDir>/test-results',
            outputName: 'junit.xml'
        }]
    ]
};