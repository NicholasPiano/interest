var Request = function (url, data) {
	return $.ajax({
		type: 'post',
		data: $.isPlainObject(data) ? JSON.stringify(data) : data,
		url: url,
		error: function (xhr, ajaxOptions, thrownError) {
			if (xhr.status === 404 || xhr.status === 0) {
				setTimeout(function () {
					Request(url, data);
				}, 1000);
			}
		},
	});
}