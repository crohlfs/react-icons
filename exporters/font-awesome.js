"use strict";

const urlLoader = require("./remoteloader"),
  fontBlast = require("font-blast"),
  fs = require("fs"),
  tmp = require("tmp"),
  cheerio = require("cheerio"),
  prettier = require("prettier");

const faVersion = "v4.7.0";

urlLoader(
  [
    "https://raw.githubusercontent.com/FortAwesome/Font-Awesome/" +
      faVersion +
      "/src/icons.yml",
    "https://raw.githubusercontent.com/FortAwesome/Font-Awesome/" +
      faVersion +
      "/fonts/fontawesome-webfont.svg"
  ],
  function(remoteContent) {
    const iconNamingConventions = require("js-yaml").safeLoad(remoteContent[0])
      .icons;
    const convertFilenames = {};
    iconNamingConventions.forEach(function(icon) {
      convertFilenames[icon.unicode] = icon.id;
    });

    tmp.tmpName(function(err, path) {
      fs.writeFileSync(path, remoteContent[1]);
      fontBlast(path, "generated/font-awesome-" + faVersion, {
        filenames: convertFilenames
      }).then(() => {
        iconNamingConventions.forEach(function(icon) {
          const svg = cheerio.load(
            fs.readFileSync(
              `generated/font-awesome-${faVersion}/svg/${icon.id}.svg`
            )
          )("svg");

          const viewBox = svg.attr("viewBox");

          const code =
            'import * as React from "react";' +
            'import * as Icon from "react-icon-base";' +
            "\r\n\r\n" +
            "const SvgIcon = (props: Icon.IconBaseProps) =>" +
            `<Icon viewBox="${viewBox}" {...props}>` +
            "<g>" +
            svg.html() +
            "</g>" +
            "</Icon>" +
            "\r\n\r\n" +
            "export default SvgIcon;";

          fs.writeFileSync(
            `src/fa/${icon.id}.tsx`,
            prettier.format(code, { parser: "typescript" })
          );
        });
      });
    });
  }
);
