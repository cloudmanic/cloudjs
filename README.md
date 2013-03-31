# HTML 5 History Linking

## Api Binding

With CloudJs we have something called "Api Binding". This typically is where we make an ajax call for a particular data object. The API will return the requested object. From there you match the values returned to elements within the dom.

For example. Lets say we have an API call that returns leases that we have stored in our accounting app. For example this api call might look something like this: `http://example.com/api/v1/leases/id/66?format=json`. We can use CloudJs to bind the data attached to the lease with id 66. Here is how we would do that. 

```javascript
cloudjs.add_api_binding('http://example.com/api/v1/leases/id/66?format=json');
```

Now maybe there is some extra processing we want to do after the ajax call completes and the dom is updated. We can pass in a callback to the function above.

```javascript
cloudjs.add_api_binding('http://example.com/api/v1/leases/id/66?format=json', function (json) {
	alert('Woot! ajax call was complete');
});
```
We could see the results of the AJAX call by looking at the json object passed in as a callback function argment.

The data is binded to the dom in a few different ways. 

* Any input element with the same name as the ajax returned. For example if we had `<input type="text" name="Blah" />` and the AJAX return a variable named "Blah" the value of the input field would be updated with the value returned from the API call. 

* We also can set the data-cjs="" attribute with any DOM element and CloudJs will update the text. For example we could do something like this `<p data-cjs="text: Blah">Loading...</p>`. When the API call is returned "Loading..." would be replaced with the contents of Blah if it was returned in the API result. 

## How to disable history linking on certain links?

You can disable history liking 3 ways. You can simply set the href attribute to "#" or you can apply one of two classes to the link: cjs-no-history-true, or cjs-no-history-false. The differnce is true will continue to go on to your other bindings. The false version will just stop right there and not call your other bindings. 

* class="cjs-no-history-true"
* class="cjs-no-history-false"
* href="#"

## Manging forms with CloudJS.

When it comes to forms sometimes we want to do special ajax magic when submitting them instead of the default way web browsers handle forms. We provide some fancy ways of managing forms via CloudJs.

* Form to API - This is where we bind the form submit to a ajax call in the background. To make a form manage a call via this method simply add the following attribute to your form: `data-cjs="form-api-json"`

## Managing error from Form to API posts

If there is error returned CloudJs will call the `cloudjs.manage_error($this, errors)`. So you need to create this function in your cloudjs-config.js file. Below is an example of what this might look like.

```javascript
//
// Manage Error.
//
cloudjs.manage_error = function ($this, errors)
{
	$('.submit-action').show();
	$('.submit-action-spinner').hide();

	for(var i in errors)
	{	
		var obj = $('[name="' + errors[i].field + '"]');
		obj.parent().addClass('error-msg');
		obj.addClass('error');
		
		// Special case for select boxes.
		if(obj.parent().hasClass('selectbox'))
		{
			obj.parent().after('<p class="error-str">' + errors[i].error + '</p>');
		} else
		{
			obj.after('<p class="error-str">' + errors[i].error + '</p>');
		}
	}
}
```

The above is the default way of managing the error. Sometimes we need custom error handling. Ideally we manage error the same way throughout our application. In times when we need special handing we can use the data-cjs-error attribute. A developer would tack a function on to the cloudjs object. With data-cjs-error we pass in the name of that function. For example.....

```html
<form action="http://example.com" method="post" data-cjs="form-api-json" data-cjs-eror="new_lease_error">
.....
</form>
```

Then we extend cloudjs object like this.

```javascript
//
// Handle error for the add lease page.
//
cloudjs.new_lease_error = function ($this, errors)
{
	alert('error');
}
```

# HTML Attributes

* data-cjs="text: IndexName"
* data-cjs="form-api-json"

# Polling

cloudjs.set_polling_delay(5000);
cloudjs.add_polling('SupportEmails', 'http://example.com/poll', function () { });
cloudjs.start_polling();