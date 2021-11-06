document.querySelector('.upload_button').addEventListener('click', function(e) {
	$('glob_container').classList.toggle('off');
	this.classList.toggle('blur');
	$('upload').classList.toggle('off');
	$('schema_dir').classList.toggle('off');
	init_dir("schema_dir");
});
init_upload("upform");