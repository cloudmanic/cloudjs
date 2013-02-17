var cloudjs = {
	api_bindings: [],
	api_select_bindings: [],
	api_list_bindings: [],
	api_after_form_api_json: [],
	api_before_form_api_json: [],
	api_url_replace: {},
	page_title: '',
	current_url: '',
	history: { loadpop: false, error_page: '', scroll_top: true, focus: '', verb: 'get', data: {} }
}

//
// Setup site wide bindings. We call this to fire up cloudjs.
// Typically we would call this in a cloudjs-config.js file 
// after a document ready event is fired.
//
cloudjs.init = function ()
{
	// Setup the page for the first time. We call this later with every ajax body change.
	this.setup_page();

	// Bind form submit. When someone adds the attribute data-cjs="form-api-post"
	// to their form we know we want to have cloudjs manage the API call.
	// We assume a json response. We then parse the json and show the errors
	// on the screen. On success we call cloudjs.after_api_post_success.  
	$(document).on('submit', '[data-cjs="form-api-json"]', function() {	
		var $this = $(this);
		var success_url = $this.attr('data-succes');
		var fail_url = $this.attr('data-fail');
		var url = $this.attr('action');
		var data = $this.serialize();
		
		// Clear any past error.
		cloudjs.clear_error();
		
		// We post we loop through our callbacks.
		for(var i in cloudjs.api_before_form_api_json)
		{
		  if(! cloudjs.api_before_form_api_json[i]($this))
		  {
			  return false;
		  }
		}
		
		// Post data to API.
		$.post(url, data, function (json) {
			// Do we have errors? If so ship it off to our error handler.
			if(! json.status)
			{
				// At the form we can set the function that managed the error. 
				// If not we revert to the default error handler.
				if($this.data('cjs-error'))
				{
					cloudjs[$this.data('cjs-error')]($this, json.errors);
				} else
				{
					cloudjs.manage_error($this, json.errors);
				}
			} else
			{
				cloudjs.after_api_post_success($this, json);
				cloudjs.run_api_select_bindings();
				cloudjs.run_api_list_bindings();
				cloudjs.run_api_bindings();
			}
			
			// We are done. Loop through our callbacks.
			for(var i in cloudjs.api_after_form_api_json)
			{
				cloudjs.api_after_form_api_json[i](json);
			}
			
			// If this is successful and we passed in a url to 
			// redirect to we do just that.
			if(json.status && success_url)
			{
				cloudjs.history.verb = 'get';
				cloudjs.current_url = success_url;
				cloudjs.history.data = {};
				history.pushState('', cloudjs.page_title, cloudjs.current_url);
				cloudjs.history.load_body();
				return false;
			}
			
			// If this is a falure and we passed in a url to 
			// redirect to we do just that.
			if((! json.status) && fail_url)
			{
				cloudjs.history.verb = 'get';
				cloudjs.current_url = fail_url;
				cloudjs.history.data = {};
				history.pushState('', cloudjs.page_title, cloudjs.current_url);
				cloudjs.history.load_body();
				return false;
			}
		});
		
		return false;
	});
}

// -------------- Start History --------------- //

//
// Setup deep linking (or history linking or html5 push state).
// Tons of terms all meaning the same thing. We default to 
// hashes if the browser does not support html5 push state.
//
cloudjs.history.setup_linking = function ()
{
	// We do not turn this on for IE.
	if($.browser.msie)
	{
		return false;
	}

	// This is called when the website state changes.	
	window.onpopstate = function (event) {
		// Sometimes we do not want to load the body on first page load
		// because the body will come in the full page response.
		if(! cloudjs.history.loadpop)
		{
			cloudjs.history.loadpop = true;
			return false;
		}
		
		// Load the body. The user most likely went back or something.
		cloudjs.current_url = document.location.href;
		cloudjs.history.load_body();
	}

	// Setup click event for anchors.
	$(document).on('click', 'a', function() { 
		var $this = $(this);
	
		// Make sure this link it meant to be deep linked.
		if($this.hasClass('cjs-no-history-true')) { return true; }
		if($this.hasClass('cjs-no-history-false')) { return false; }	
		if($this.attr('href') == '#') { return false; }
		if($(this).attr('href') == 'javascript:void(null);') { return false; }

		// Push the history state and load the body.
		cloudjs.history.verb = 'get';
		cloudjs.current_url = $this.attr('href');
		cloudjs.history.data = {};
		history.pushState('', cloudjs.page_title, cloudjs.current_url);
		cloudjs.history.load_body();
				
		return false;
	});
}

// 
// Call this when we need to make an ajax call to change the html in the body.
//
cloudjs.history.load_body = function ()
{			
	// Clear past bindings.
	cloudjs.clear_bindings();

	// Set ajax settings.
	var settings = {
		cache: false,
		data: cloudjs.history.data,
		type: cloudjs.history.verb,
		dataType: 'html',
		
		error: function (xhr, status, error) {
			// Show 404 page if we have set one.
	  	if((status != "success") && (cloudjs.history.error_page.length > 0))
	  	{
	  		$(cloudjs.history.body_cont).load(cloudjs.history.error_page);
	  	}
		},
		
		success: function (response) {
		  // See if this is a full redirect (no more ajax, reload page).
		  if(response.match('cloudjs-redirect:')) 
		  { 
		  	window.location = response.replace('cloudjs-redirect:', '');
		  	return;
		  }
		  
			// Load the response from the get.
			$('[data-cjs="body"]').html(response);
		  
		  // Set the focus. 
		  if(cloudjs.history.focus.length > 0)
		  {
		  	$('#' + cloudjs.history.focus).focus();
		  	cloudjs.history.focus = '';
		  }
		  
		  // After page load call init functions.
		  if(cloudjs.history.scroll_top)
		  {
			  $(window).scrollTop(0);
			  cloudjs.history.scroll_top = true;
		  }
		  
		  // Do all the magic after the page has been rendered. 
		  cloudjs.setup_page();
		}
	}

	$.ajax(cloudjs.current_url, settings);
}

//
// Change the page.
//
cloudjs.change_page = function (href)
{
	cloudjs.history.verb = 'get';
	cloudjs.current_url = href;
	cloudjs.history.data = {};
	history.pushState('', cloudjs.page_title, cloudjs.current_url);
	cloudjs.history.load_body();
}

//
// Refresh page.
//
cloudjs.refresh_page = function ()
{
	cloudjs.history.load_body();
}

//
// Refresh current page without a scroll to the top.
//
cloudjs.refresh_page_no_scroll = function()
{
	cloudjs.history.scroll_top = false;
	cloudjs.history.load_body()
}

//
// Call after page load.
//
cloudjs.after_body_load = function (response)
{
	return true;
}

// -------------- Helper Functions ---------------- //


//
// Setup Page. We call this on every new page load.
//
cloudjs.setup_page = function (response)
{
	this.refresh_bindings();
	this.after_body_load(response);
}

//
// Add call backs after a form post.
//
cloudjs.add_form_post_callback = function (type, func)
{
	switch(type)
	{
		case 'after-form-api-json':
			this.api_after_form_api_json.push(func);
		break;
		
		case 'before-form-api-json':
			this.api_before_form_api_json.push(func);
		break;
	}
}

//
// After a succes in api post.
//
cloudjs.after_api_post_success = function ($this, json)
{
	return true;
}

//
// Manage Error.
//
cloudjs.manage_error = function ($this, errors)
{
	return true;
}

//
// Clear all error from the screen.
//
cloudjs.clear_error = function()
{
	return true;
}

// ------------------ Bindings ---------------------------------- //

//
// Clear the all bindings.
//
cloudjs.clear_bindings = function ()
{
	this.api_bindings = [];
	this.api_select_bindings = [];
	this.api_list_bindings = [];
	this.api_after_form_api_json = [];
	this.api_before_form_api_json = [];
	this.api_url_replace = [];
}

//
// Refresh bindings.
//
cloudjs.refresh_bindings = function ()
{
	this.run_api_select_bindings();
	this.run_api_list_bindings();
	this.run_api_bindings();
}

//
// Add a binding url.
//
cloudjs.add_binding = function (type, url, tmpl, cont, callback)
{
	switch(type)
	{
		case 'api-select':
			var d = tmpl.split(':::');
			this.api_select_bindings.push({ url: url, cont: cont, selected: d[3], value: d[0], text: d[1], callback: callback });
		break;
	
		case 'api':
			this.api_bindings.push({ url: url, callback: callback });
		break;
		
		case 'api-list':
			this.api_list_bindings.push({ url: url, tmpl: tmpl, cont: cont, callback: callback });		
		break;
	}
}

//
// Wrapper function for adding value bindings.
//
cloudjs.add_api_binding = function (url, callback)
{
	this.add_binding('api', url, null, null, callback);
}

//
// Clear API bindings.
//
cloudjs.clear_api_bindings = function ()
{
	this.api_bindings = [];	
}

//
// Wrapper funcion for add_binding. Makes is a little
// cleared to remember how this function works. 
//
cloudjs.add_api_select_binding = function (url, cont, selected, value, text, callback)
{
	this.add_binding('api-select', url, value + ':::' + text + ':::' + selected, cont, callback);
}

//
// Clear API select bindings.
//
cloudjs.clear_api_select_bindings = function ()
{
	this.api_select_bindings = [];
}

//
// Wrapper function for add_binding. Makes it a little
// cleaner to remember this functions argments with 
// descriptive function names.
//
cloudjs.add_api_list_binding = function (url, tmpl, cont, callback)
{
	this.add_binding('api-list', url, tmpl, cont, callback);
}

//
// Clear the API list bindings.
//
cloudjs.clear_api_list_bindings = function ()
{
	this.api_list_bindings = [];
}

//
// This is a binding where the API returns a list. 
// Each entry in the list is a option in a select menu.
//
cloudjs.run_api_select_bindings = function ()
{
	for(var i in this.api_select_bindings)
	{	
		this._manage_select(i);
	}
}

//
// Helper function to manage the scope as
// things get wonky in a non-blocking world. 
//
cloudjs._manage_select = function (i)
{
	var callback = this.api_select_bindings[i].callback;
	var cont = this.api_select_bindings[i].cont;
	var value = this.api_select_bindings[i].value; 
	var text = this.api_select_bindings[i].text;
	var selected = this.api_select_bindings[i].selected;
	
	// Make sure we have the container on the dom.
	if(! $('[data-cjs-select="' + cont + '"]').length)
	{
		return false;
	}
	
	// Make Ajax call to get data for this element.
	$.get(this.api_select_bindings[i].url, function (json) {			
	  // Make sure nothing went wrong with the ajax call.
	  if(! json.status)
	  {
	    return false;
	  }	
	
	  // Loop through and build out the selector.
	  var html = '';
	  
	  for(var r in json.data)
	  {				
	  	if(json.data[r][value] == selected)
	  	{
	  		html += '<option value="' + json.data[r][value] + '" selected>' + json.data[r][text] + '</option>';
	  	} else
	  	{
	  		html += '<option value="' + json.data[r][value] + '">' + json.data[r][text] + '</option>';					
	  	}
	  }
	  
	  // Set the html
	  $('[data-cjs-select="' + cont + '"]').html(html);
	  
	  // Call the callback.
	  if((typeof callback) == 'function')
	  {
	  	callback(json);
	  }
	});
}

//
// This is a binding where the api returns a list of 
// results and then we use a templating engine 
// to display them to the screen. 
//
cloudjs.run_api_list_bindings = function ()
{
	for(var i in this.api_list_bindings)
	{
		var index = i;
		var tmpl = this.api_list_bindings[i].tmpl;
		var cont = this.api_list_bindings[i].cont;
		var callback = this.api_list_bindings[i].callback;
		var url = this.api_list_bindings[i].url;
		
		// Filter the url and add any search and replaces.
		if(typeof cloudjs.api_url_replace[cont] != 'undefined')
		{
			for(var r in cloudjs.api_url_replace[cont])
			{
				var val = $('[data-cjs="replace: ' + cloudjs.api_url_replace[cont][r].term + '"]').val();
				
				// Check for checkboxes / radio buttons
				if(($('[data-cjs="replace: ' + cloudjs.api_url_replace[cont][r].term + '"]').prop('type') == 'radio') || ($('[data-cjs="replace: ' + cloudjs.api_url_replace[cont][r].term + '"]').prop('type') == 'checkbox'))
				{
					val = $('[data-cjs="replace: ' + cloudjs.api_url_replace[cont][r].term + '"]:checked').val();
				} 
				
				url = url.replace(':' + cloudjs.api_url_replace[cont][r].term + ':', val);
			}
		}
		
		// Make query.
		$.ajax({
			url: url,
			cont: cont,
			index: index,
			callback: callback,
			tmpl: tmpl,
			success: function (json) {		
				// Compile the template.
				var source = $(this.tmpl).html();
				var list = Handlebars.compile(source);
				
				// Make sure nothing went wrong with the ajax call.
				if(! json.status)
				{
				  return false;
				}
				
				// Render list to screen.
				$(this.cont).html(list(json));
				
				// Show hide stuff based on the size of the list.
				if(json.data.length > 0)
				{
					$('[data-cjs="api-list-no-results-' + this.index + '"]').hide();
					$('[data-cjs="api-list-results-' + this.index + '"]').show();
				} else
				{
					$('[data-cjs="api-list-no-results-' + this.index + '"]').show();
					$('[data-cjs="api-list-results-' + this.index + '"]').hide();				
				}
				
				// Call the callback.
				if((typeof this.callback) == 'function')
				{
					this.callback();
				}
			}
		});
	}
}

//
// Manage api bindings. Look through the api_bindings
// array and make ajax calls to the API. When it returns
// data jump through the DOM updating elements with the 
// returned data.
//
cloudjs.run_api_bindings = function ()
{
	for(var i in this.api_bindings)
	{
		$.get(this.api_bindings[i].url, function (json) {
			if(json.status)
			{
				for(var field in json.data)
				{
					// Fields
					switch($('[name="' + field + '"]').attr('type'))
					{					
						case 'radio':
							$('[name="' + field + '"]').filter('[value="' + json.data[field] + '"]').prop('checked', true);
						break;
					
						case 'checkbox':
							if(json.data[field] == "0")
							{
								$('[name="' + field + '"]').prop('checked', false);
							} else
							{
								$('[name="' + field + '"]').prop('checked', true);
							}
							$('[name="' + field + '"]').val(1);
						break;
						
						default:
							$('[name="' + field + '"]').val(json.data[field]);
						break;
					} 
					
					// Data attribute 
					$('[data-cjs="text: ' + field + '"]').text(json.data[field]);
				}
			}
			
			// Run the callback.
			if((typeof cloudjs.api_bindings[i].callback) == 'function')
			{
				cloudjs.api_bindings[i].callback(json);
			}
		});
	}
}

//
// Add url replace.
//
cloudjs.add_url_replace = function (cont, term)
{
	if((typeof this.api_url_replace[cont]) == 'undefined')
	{
		this.api_url_replace[cont] = [];
	} 
	
	this.api_url_replace[cont].push({ term: term, type: 'value' });
}

// ------------------ Handlebars Helpers ------------------------ //


//
// HTMLify a string.
//
Handlebars.registerHelper('htmlify', function(lvalue, rvalue, options) {
	return new Handlebars.SafeString(lvalue);
});

//
// {{compare unicorns ponies operator="<"}}
// 	I knew it, unicorns are just low-quality ponies!
// {{/compare}}
// 
// (defaults to == if operator omitted)
//
// {{equal unicorns ponies }}
// 	That's amazing, unicorns are actually undercover ponies
// {{/equal}}
// (from http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/)
//
Handlebars.registerHelper('compare', function(lvalue, rvalue, options) {

  if (arguments.length < 3)
  	throw new Error("Handlerbars Helper 'compare' needs 2 parameters");

  operator = options.hash.operator || "==";
  
  var operators = {
  	'==':		function(l,r) { return l == r; },
  	'===':	function(l,r) { return l === r; },
  	'!=':		function(l,r) { return l != r; },
  	'<':		function(l,r) { return l < r; },
  	'>':		function(l,r) { return l > r; },
  	'<=':		function(l,r) { return l <= r; },
  	'>=':		function(l,r) { return l >= r; },
  	'typeof':	function(l,r) { return typeof l == r; }
  }

  if (!operators[operator])
  	throw new Error("Handlerbars Helper 'compare' doesn't know the operator "+operator);

  var result = operators[operator](lvalue,rvalue);

  if( result ) {
  	return options.fn(this);
  } else {
  	return options.inverse(this);
  }
  
});