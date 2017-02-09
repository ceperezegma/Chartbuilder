import {clone, reduce, keys, isUndefined, isArray} from 'lodash';
import d3 from 'd3';
import ss from 'simple-statistics';

const colorScales = require('./colorscales');
const processDates = require("./process-dates");

/* legend
*/
const legendmargin = 1.5;

/*
const legendtotal = 140;
const groupmargin = 60;
const legendrect = 30;*/

const legendTotalPercents = {
	1: 60,
	2: 45,
	3: 30,
	4: 20
}

let socialbinary = false;
/**
 * Generate an exact number of ticks given a domain
 *
 * @param {number[]} domain - min/max of the current scale
 * @param {number} numticks - desired number of ticks
 * @return {string[]} Array of ticks
 * @static
 * @memberof helper
 */

const exact_ticks = (domain, numticks, type, tickVals, allvalues) => {
  let ticks = [];
  let i;
  let delta;

  if (type === 'threshold') {
    numticks -= 3;

    if ((tickVals.length - 1) !== numticks) {
      const max = d3.max(tickVals) - 1;
      const min = d3.min(tickVals) + 1;

      delta = max - min;

      for (i = 0; i < numticks; i++) {
        ticks.push(min + (delta / numticks) * i);
      }
      ticks.push(max);
    } else {
     return tickVals;
    }

    return ticks
  } else if (type === 'cluster') {
  	ticks = _compute_domain('cluster', numticks, allvalues);
	} else {
    numticks -= 1;
    delta = domain[1] - domain[0];

    for (i = 0; i < numticks; i++) {
      ticks.push(domain[0] + (delta / numticks) * i);
    }
    ticks.push(domain[1]);
  }

  if (domain[1] * domain[0] < 0) {
    //if the domain crosses zero, make sure there is a zero line
    let hasZero = false;
    for (i = ticks.length - 1; i >= 0; i--) {
      //check if there is already a zero line
      if (ticks[i] === 0) {
        hasZero = true;
      }
    }
    if (!hasZero) {
      ticks.push(0);
    }
  }

  return ticks;
}

const find_median = (data) => {

  const m = data.map(v => v ).sort((a, b) => a - b );

  const middle = Math.floor((m.length - 1) / 2); // NB: operator precedence

  if (m.length % 2) return m[middle];
  else return (m[middle] + m[middle + 1]) / 2.0;

}


const _compute_domain = (type, ticks, allvalues) => {

  const scaleconstruct = [];
  switch(type) {
    case('cluster'):
      if (ticks === allvalues.length) {
        return allvalues.map(d => parseInt(d));
      } else {
        for (const z of ss.ckmeans(allvalues,ticks)) {
          scaleconstruct.push(find_median(z));
        };
      }
      return scaleconstruct;
      break;
    case('threshold'):
      ss.ckmeans(allvalues,ticks).forEach(function(z) {
        scaleconstruct.push(find_median(z));
      });
      return scaleconstruct;
      break;
  }
}

/**
 * compute_scale_domain
 *
 * @param scaleObj - Current scale before generating new domain
 * @param {number[]} data - All values in the current scale
 * @param {object} opts - Whether to return nice values or force a minimum of 0
 * or below
 * @return {object} { domain: [min, max], custom: <boolean> }
 * @static
 * @memberof helper
 */
function compute_scale_domain(scaleObj, data, opts) {
	// Compute the domain (`[min, max]`) of a scale based on its data points.
	// `data` is a flat array of all values used in this scale, and is
	// created by `input-parsers/parse-<chart>.js`
	opts = opts || {};
	var scaleDomain = scaleObj.domain || [];
	var _domain;
	var defaultMin;
	var defaultMax;

	if (!isArray(data)) {
		throw new TypeError("data passed to compute_scale_domain must be an array");
	}

	var extent = (scaleDomain.length > 0) ? [scaleDomain[0], scaleDomain[1]] : d3.extent(data);

	var niced = d3.scale.linear()
			.domain(extent)
			.nice()
			.domain();

	if (!scaleObj.domain || !scaleObj.custom) {
		if (opts.nice) {
			_domain = niced;
		} else {
			_domain = extent;
		}
		defaultMin = true;
		defaultMax = true;
	} else {
		_domain = (opts.nice) ? niced : extent;
		defaultMin = (_domain[0] === scaleDomain[0] || isUndefined(scaleDomain[0]));
		defaultMax = (_domain[1] === scaleDomain[1] || isUndefined(scaleDomain[1]));
		_domain = scaleDomain;
	}

	if (opts.minZero) {
		_domain[0] = Math.min(_domain[0], 0);
	}

	return {
		domain: _domain,
		custom: (!defaultMin || !defaultMax)
	};
}


/**
 * compute_map_scale_domain
 *
 * @param scaleObj - Current scale before generating new domain
 * @param {number[]} data - All values in the current scale
 * @param {object} opts - Whether to return nice values or force a minimum of 0
 * or below
 * @return {object} { domain: [min, max], custom: <boolean> }
 * @static
 * @memberof helper
 */
function compute_map_scale_domain(scaleObj, data, opts, type, ticks, number_colors) {
	// Compute the domain (`[min, max]`) of a scale based on its data points.
	// `data` is a flat array of all values used in this scale, and is
	// created by `input-parsers/parse-<chart>.js`
	opts = opts || {};
	var scaleDomain = scaleObj.domain || [];
	var _domain;
	var defaultMin;
	var defaultMax;

	if (!isArray(data)) {
		throw new TypeError("data passed to compute_scale_domain must be an array");
	}

	var extent = (scaleDomain.length > 0) ? [scaleDomain[0], scaleDomain[1]] : d3.extent(data);

	var niced = d3.scale.linear()
			.domain(extent);
			//.nice();

	if (!scaleObj.domain || !scaleObj.custom) {
		if (opts.nice) {
			_domain = niced;
		} else {
			_domain = extent;
		}
		defaultMin = true;
		defaultMax = true;
	} else {
		_domain = (opts.nice) ? niced : extent;
		defaultMin = (_domain[0] === scaleDomain[0] || isUndefined(scaleDomain[0]));
		defaultMax = (_domain[1] === scaleDomain[1] || isUndefined(scaleDomain[1]));
		_domain = scaleDomain;
	}

	if (opts.minZero) {
		_domain[0] = Math.min(_domain[0], 0);
	}



	return {
		domain: _domain
	};
}

/**
 * round_to_precision
 * Round a number to N decimal places
 *
 * @param {number} num - Number to be rounded
 * @param {number} precision - Desired precision
 * @param {boolean} supress_thou_sep
 * @static
 * @memberof helper
 * @return {number} Rounded number
 */
function round_to_precision(num, precision, supress_thou_sep) {
	if (num === 0) {
		//zero should always be "0"
		return "0";
	}

	var s = Math.round(num * Math.pow(10,precision)) / Math.pow(10,precision);
	s = s + "";

	s = s.split(".");

	if (s.length == 1) {
		s[1] = "";
	}

	if (s[1].length < precision) {
		s[1] += Array(precision-s[1].length + 1).join("0");
	}

	if (!supress_thou_sep) {
		s[0] = d3.format(",")(parseInt(s[0]));
	}

	if (precision === 0) {
		return s[0];
	}

	return s.join(".");
}

/**
 * combine_margin_pading
 *
 * @param m
 * @param p
 * @static
 * @memberof helper
 * @return {object}
 */
function combine_margin_pading(m,p) {
	return {
		top: m.top + p.top,
		right: m.right + p.right,
		bottom: m.bottom + p.bottom,
		left: m.left + p.left
	};
}

/**
 * precision
 *
 * @param a
 * @static
 * @memberof helper
 * @return {undefined}
 */
function precision(a) {
  // http://stackoverflow.com/a/27865285/1181761

  // guard for NaN
  if (a === a) {
		var e = 1;
		while (Math.round(a * e) / e !== a) e *= 10;
		return Math.round(Math.log(e) / Math.LN10);
  } else {
		return 0;
  }
}

/**

**/
function get_decimals(num) {
	//http://stackoverflow.com/questions/10454518/javascript-how-to-retrieve-the-number-of-decimals-of-a-string-number
	//
  var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  if (!match) { return 0; }
  return Math.max(
       0,
       // Number of digits right of decimal point.
       (match[1] ? match[1].length : 0)
       // Adjust for scientific notation.
       - (match[2] ? +match[2] : 0));
}



/**
 * transform_coords
 *
 * @param transformString
 * @static
 * @memberof helper
 * @return {undefined}
 */
function transform_coords(transformString) {
	// Split on both space and comma because IE10 likes spaces?
	var s = transformString.split(/\s|,/);
	return [s[0].split("(")[1],s[1].split(")")[0]].map(parseFloat);
}

/**
 * Given a defaults object and a source object, copy the value from the source
 * if it contains the same key, otherwise return the default. Skip keys that
 * only exist in the source object.
 * @param {object} defaults - Default schema
 * @param {object} source - Source object to copy properties from
 * @returns {object} - Result has identical keys to defaults
 * @static
 * @memberof helper
*/
function merge_or_apply(defaults, source) {
	var defaultKeys = keys(defaults);
	var sourceKeys = keys(source);
	return reduce(defaultKeys, function(result, key) {
		if (sourceKeys.indexOf(key) > -1) {
			result[key] = source[key];
			return result;
		} else {
			result[key] = defaults[key];
			return result;
		}
	}, {});
}

/**
 * Given a the domain of a scale suggest the most numerous number
 * of round number ticks that it cold be divided into while still containing
 values evenly divisible by 1, 2, 2.5, 5, 10, or 25.
 * @param {array} domain - An array of two number like objects
 * @returns {integer} - Result is a single integer representing a nice number of ticks to use
 * @static
 * @memberof helper
*/
function suggest_tick_num(domain) {
	var MAX_TICKS = 10;
	var INTERVAL_BASE_VALS = [1, 2, 2.5, 5, 10, 25];
	var range = Math.abs(domain[0] - domain[1])
	var minimum = range / MAX_TICKS;
	var digits = Math.floor(range).toString().length;
	var multiplier = Math.pow(10, (digits - 2));

	var acceptable_intervals = reduce(INTERVAL_BASE_VALS, function(prev, curr) {
		var mult = curr * multiplier;

		if (mult >= minimum) {
			prev = prev.concat([mult]);
		}

		return prev;
	}, []);

	for (var i = 0; i < acceptable_intervals.length; i++) {
		var interval = acceptable_intervals[i]
		if(range % interval == 0) {
			return (range / interval) + 1
		}
	};

	return 11;
}

/**
 * Given a timezone offset in an hour:minute format and return the equivalent
 * number of minutes as a number
 * only exist in the source object.
 * @param {object} offset - A string in a hh:mm format or "Z" for no offset
 * @returns {number} - Number of minutes
 * @static
 * @memberof helper
*/
function tz_offset_to_minutes(offset) {
	if (offset == "Z") {
		return 0
	}

	var offset = offset.split(":")

	if(offset.length == 1) {
		offset = offset[0]
		split_loc = offset.length - 2
		offset = [offset.substring(0, split_loc), offset.substring(split_loc)]
	}
	const sign = offset[0].indexOf("-") > -1 ? -1 : 1

	offset = offset.map(parseFloat)

	return (offset[0]*60) + (sign * offset[1])
}


/* Map helpers */



const construct_legend_ticks = (tickValues, colors, thescale) => {

  if (thescale === 'quantize') {

    if (colors === tickValues.length) return tickValues;

    const value = [];
    const span = d3.max(tickValues) - d3.min(tickValues);
    const space = span / colors;

    for (let i = 0; i < colors + 1; i++) {
      value.push(d3.min(tickValues) + (i * space));
    }

    return value;

  } else {

    return tickValues;

  }
}

const construct_legend_transform = (i, legendspacings, thislegend) => {

  let skipx = 0;
  let movey = i;

  let this_space_group = Math.floor(i / 4.1);
  let group_space_index;

  if (this_space_group > 0) group_space_index = this_space_group - 1;
  else group_space_index = 0;

  if (i > 1) skipx = legendspacings[group_space_index];
  if (!this_space_group) skipx = 0;

  movey = i - (this_space_group * 2);

  return [skipx,(movey * -120)];
}


/*
const construct_legend_spacings = () => {
  const maxl = 0;

  const legendspacings = [];
  let maxspace = 0;
  let i = 0;

  while (i < (scales.length)) {

     if (!(i % 2) && !!i) {
      legendspacings.push({
        max: maxspace
      });
      maxspace = 0;
    }

    let numcolors = scales[i].values.colors.length;
    let totalcolorw;

    if (numcolors < 2) {
      numcolors = 2;
      totalcolorw = (legendrect * 2) + groupmargin + legendmargin;
    } else {
      totalcolorw = legendtotal + (legendmargin * 5) + groupmargin;
    }

    let test = d3.select('#hidden-div').html(keyConversion(scales[i].key));
    let testw = (2 * document.getElementById('hidden-div').offsetWidth);

    if (testw > wrapmax) testw = wrapmax;

    testw = testw + groupmargin;

    if (i > 1) {

      totalcolorw = totalcolorw + legendspacings[legendspacings.length - 1].max;
      testw = testw + legendspacings[legendspacings.length - 1].max;
    }

    if (testw > totalcolorw && testw > maxspace) { maxspace = testw; }
    else if (totalcolorw > testw && totalcolorw > maxspace) { maxspace = totalcolorw; }

    i++;
  }
}*/

const convert_title_case = (str) => {

    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}


const return_D3_scale = (colorIndex, number_colors, domain, type, allvalues, tickValues) => {

  const colors = colorScales.scalesMap(colorIndex)[number_colors];

  const newDomain = clone(domain);
  // adjust scale so it returns a color for single value entries
  const domainMax = d3.min(newDomain);
  const domainMin = d3.max(newDomain);

  switch(type) {
    case('quantize'):
	    if (domainMax === domainMin) {
		    newDomain[0] = domainMin - 1;
		    newDomain[newDomain.length - 1] = domainMax + 1;
		  }

      return d3.scale.quantize()
        .domain(newDomain)
        .range(colors);
      break;
    case('cluster'):
      const computeddomain = _compute_domain(type, (number_colors - 1), allvalues);

      return d3.scale.quantile()
        .domain(computeddomain)
        .range(colors);
      break;
    case('threshold'):
      const tickValuesThreshold = clone(tickValues);

      tickValuesThreshold[0] = tickValuesThreshold[0] + 1;
      tickValuesThreshold[tickValuesThreshold.length - 1] = tickValuesThreshold[tickValuesThreshold.length - 1] - 1;

      return d3.scale.threshold()
        .domain(tickValuesThreshold)
        .range(colors);
      break;
    case (undefined):
      return  d3.scale[type]().domain(newDomain).range(colors);
      break;
  }
}

/**
 * Helper functions!
 * @name helper
 */
var helper = {
	exactTicks : exact_ticks,
	roundToPrecision: round_to_precision,
	combineMarginPadding: combine_margin_pading,
	computeScaleDomain: compute_scale_domain,
	computeMapScaleDomain: compute_map_scale_domain,
  constructLegendTicks: construct_legend_ticks,
  constructLegendTransform: construct_legend_transform,
	precision: precision,
	getDecimals: get_decimals,
	transformCoords: transform_coords,
	toTitleCase: convert_title_case,
	mergeOrApply: merge_or_apply,
	suggestTickNum: suggest_tick_num,
  returnD3Scale: return_D3_scale,
	TZOffsetToMinutes: tz_offset_to_minutes
};

module.exports = helper;
