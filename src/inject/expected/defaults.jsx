/* eslint import/no-unresolved:0 */
var React = require('react');

var App = React.createClass({

  render: function () {
    return (
      <html>
        <head>
          <title>gulp-inject</title>
          {/* inject:html */}
          <link rel="import" href="/fixtures/component.html" />
          {/* endinject */}
          {/* inject:css */}
          <link rel="stylesheet" href="/fixtures/styles.css" />
          {/* endinject */}
        </head>
        <body>
          {/* inject:js */}
          <script src="/fixtures/lib.js"></script>
          {/* endinject */}
        </body>
      </html>
    );
  }

});

module.exports = App;
