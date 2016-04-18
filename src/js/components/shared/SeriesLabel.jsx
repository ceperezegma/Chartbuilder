// Svg text elements used to describe chart
var React = require("react");
var PropTypes = React.PropTypes;

var SeriesLabel = React.createClass({

	propTypes: {
		text: PropTypes.string,
		translate: PropTypes.array,
		colorIndex: PropTypes.number
	},

	getDefaultProps: function() {
		return {
			translate: [0, 0],
			text: "SeriesLabel",
			colorIndex: 0
		};
	},

	render: function() {
		var props = this.props;

		return (
			<text
				className={"series-label color-index-" + props.colorIndex}
				transform={"translate(" + props.translate + ")"}
			>
				{props.text}
			</text>
		);
	}

});

module.exports = SeriesLabel;
