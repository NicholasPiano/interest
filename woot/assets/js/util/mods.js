// extend trunc method for strings
String.prototype.trunc = function(n, useWordBoundary) {
	var isTooLong = this.length > n;
	var s_ = isTooLong ? this.substr(0,n-1) : this;
	var s_ = (useWordBoundary && isTooLong) ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
	return	isTooLong ? s_ + '&hellip;' : s_;
}

// Trim string
if(!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^\s+|\s+$/g,'');
	}
}

String.prototype.contains = function (object) {
	return this.indexOf(object) !== -1;
}

// Arrays
Array.prototype.contains = function (object) {
	return this.indexOf(object) !== -1;
}

Array.prototype.sum = function (object) {
	return this.reduce(function (f, s) {
		return f+s;
	});
}

Array.range = function (start, stop, step) {
	if (typeof stop == 'undefined') {
		// one param defined
		stop = start;
		start = 0;
	}

	if (typeof step == 'undefined') {
		step = 1;
	}

	if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
		return [];
	}

	var result = [];
	for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
		result.push(i);
	}

	return result;
};

if (!Array.prototype.last){
	Array.prototype.last = function(){
		return this[this.length - 1];
	};
};

// Ordered promises
Promise.ordered = function (promiseFunctions, input) {
	if (promiseFunctions.length !== 0) {
		return promiseFunctions.reduce(function (previousResult, currentPromise) {
			return previousResult.then(function (previousValue) {
				return currentPromise(previousValue);
			});
		}, Util.ep(input));
	} else {
		return Util.ep();
	}
}
