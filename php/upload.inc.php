<div id="upload_window" style="display: flex; flex-wrap: wrap; justify-content: center; margin: 10px;">
<div id="schema_dir" class="off" style="padding: 20px; border: 1px solid white;">
</div>
<div id="upload" class="upload off">
 <div class="upload-files">
  <header>
   <p>
    <i class="fa fa-cloud-upload" aria-hidden="true"></i>
    <span class="up">upload</span>
   </p>
  </header>
  <div class="body" id="drop">
   <i class="fa fa-file-text-o pointer-none" aria-hidden="true"></i>
   <p class="pointer-none">
   <!--<b>Drag and drop</b> files here <br /> or -->
    <a href="" id="triggerFile">Sélectionner</a> les fichiers Schémas Courage<br>Ctrl+click / Shift+Click pour choisir plusieurs fichiers</p>
	<form id="upform" enctype="multipart/form-data" action="" method="post">
	<input name="fichier[]" type="file" value="Choisir" id="fichiers" multiple/>
	</form>
  </div>
  <footer>
   <div class="divider">
    <span><AR>FILES</AR></span>
   </div>
   <div class="list-files">
    <!--   template   -->
   </div>
	<button class="importar">UPDATE FILES</button>
  </footer>
 </div>
</div>
</div>