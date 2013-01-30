# HTML 5 History Linking

## How to disable history linking on certain links?

You can disable history liking 3 ways. You can simply set the href attribute to "#" or you can apply one of two classes to the link: cjs-no-history-true, or cjs-no-history-false. The differnce is true will continue to go on to your other bindings. The false version will just stop right there and not call your other bindings. 

* class="cjs-no-history-true"
* class="cjs-no-history-false"
* href="#"

## Manging forms with CloudJS.

When it comes to forms sometimes we want to do special ajax magic when submitting them instead of the default way web browsers handle forms. We provide some fancy ways of managing forms via CloudJs.

* Form to API - This is where we bind the form submit to a ajax call in the background. To make a form manage a call via this method simply add the following attribute to your form: `data-cjs="form-api-post"`

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