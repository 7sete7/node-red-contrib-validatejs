var validate = require("validate.js");
var DateTime = require('luxon').DateTime;

validate.extend(validate.validators.datetime, {
    parse: function(value, options) {
        return +DateTime.fromISO(value).toMillis();
    },
    format: function(value, options) {
        var format = options.dateOnly ? "yyyy-MM-dd" : "yyyy-MM-dd hh:mm";
        return DateTime.fromMillis(value).toFormat(format);
    }
});

module.exports = function(RED) {
	"use strict";

	function TemplateNode(config) {
		RED.nodes.createNode(this, config);
		const node = this;

		this.field = config.field || "payload";
		this.template = config.validate;
		this.fieldType = config.fieldType || "msg";

		node.on("input", function(msg) {
			node.status({});

			try {
				// Use msg.template property if template editor is empty
				if (msg.hasOwnProperty("template")) {
					if (this.template == "" || this.template === null) {
						this.template = msg.template;
					}
				}

				const data = RED.util.evaluateNodeProperty(this.field, this.fieldType, this, msg);
				const constraints = JSON.parse(this.template);

				const result = validate(data, constraints, { format: "grouped" });
				if (Object.keys(result || {}).length > 0) {
					node.send([null, { ...msg, payload: result }]);
					return;
				}

				node.send([msg, null]);
			} catch (e) {
				node.error(e);
				node.status({
					fill: "red",
					shape: "ring",
					text: "Error in validation"
				});
				node.send([null, e]);
			}
		});
	}

	RED.nodes.registerType("validate", TemplateNode);
};
