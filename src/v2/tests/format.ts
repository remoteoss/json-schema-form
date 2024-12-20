export const formatTests = [
  {
    title: 'email format',
    schema: { format: 'email' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'idn-email format',
    schema: { format: 'idn-email' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'regex format',
    schema: { format: 'regex' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'ipv4 format',
    schema: { format: 'ipv4' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'ipv6 format',
    schema: { format: 'ipv6' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'idn-hostname format',
    schema: { format: 'idn-hostname' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'hostname format',
    schema: { format: 'hostname' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'date format',
    schema: { format: 'date' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
      { data: '1963-06-19' },
      { data: '2020-01-31' },
      { data: '2021-02-28' },
      { data: '2020-02-29' },
      { data: '2020-03-31' },
      { data: '2020-04-30' },
      { data: '2020-05-31' },
      { data: '2020-06-30' },
      { data: '2020-07-31' },
      { data: '2020-08-31' },
      { data: '2020-09-30' },
      { data: '2020-10-31' },
      { data: '2020-11-30' },
      { data: '2020-12-31' },
      { data: '2020-02-29' },
    ],
    invalidTestCases: [
      { data: '2020-01-32' },
      { data: '2021-02-29' },
      { data: '2020-02-30' },
      { data: '2020-03-32' },
      { data: '2020-04-31' },
      { data: '2020-05-32' },
      { data: '2020-06-31' },
      { data: '2020-07-32' },
      { data: '2020-08-32' },
      { data: '2020-09-31' },
      { data: '2020-10-32' },
      { data: '2020-11-31' },
      { data: '2020-12-32' },
      { data: '2020-13-01' },
      { data: '06/19/1963' },
      { data: '2013-350' },
      { data: '1998-1-20' },
      { data: '1998-01-1' },
      { data: '1998-13-01' },
      { data: '1998-04-31' },
      { data: '2021-02-29' },
      { data: '1963-06-1৪' },
      { data: '20230328' },
      { data: '2023-W01' },
      { data: '2023-W13-2' },
      { data: '2022W527' },
    ],
  },
  {
    title: 'date-time format',
    schema: { format: 'date-time' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
      { data: '1963-06-19T08:30:06.283185Z' },
      { data: '1963-06-19T08:30:06Z' },
      { data: '1937-01-01T12:00:27.87+00:20' },
      { data: '1990-12-31T15:59:50.123-08:00' },
      // { data: '1998-12-31T23:59:60Z' }, // cannot support leap seconds
      // { data: '1998-12-31T15:59:60.123-08:00' }, // cannot support leap seconds
      { data: '1963-06-19t08:30:06.283185z' },
    ],
    invalidTestCases: [
      { data: '1998-12-31T23:59:61Z' },
      { data: '1998-12-31T23:58:60Z' },
      { data: '1998-12-31T22:59:60Z' },
      { data: '1990-02-31T15:59:59.123-08:00' },
      { data: '1990-12-31T15:59:59-24:00' },
      { data: '1963-06-19T08:30:06.28123+01:00Z' },
      { data: '06/19/1963 08:30:06 PST' },
      { data: '2013-350T01:01:01' },
      { data: '1963-6-19T08:30:06.283185Z' },
      { data: '1963-06-1T08:30:06.283185Z' },
      { data: '1963-06-1৪T00:00:00Z' },
      { data: '1963-06-11T0৪:00:00Z' },
    ],
  },
  {
    title: 'time format',
    schema: { format: 'time' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'json-pointer format',
    schema: { format: 'json-pointer' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'relative-json-pointer format',
    schema: { format: 'relative-json-pointer' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'iri format',
    schema: { format: 'iri' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'iri-reference format',
    schema: { format: 'iri-reference' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'uri format',
    schema: { format: 'uri' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'uri-reference format',
    schema: { format: 'uri-reference' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
  {
    title: 'uri-template format',
    schema: { format: 'uri-template' },
    validTestCases: [
      { data: 12 },
      { data: 13.7 },
      { data: {} },
      { data: [] },
      { data: false },
      { data: null },
    ],
  },
];
