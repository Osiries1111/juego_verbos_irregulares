# Juego Verbos Irregulares
Pequeño proyecto personal donde te ayudo a aprenderte los verbos en inglés, en todas sus formas, tanto en formato local (descargando el repo), como online 

## Por qué?
Porque necesitaba repasar los verbos y también para poder ayudar a otros a aprendeserlos :3.

## Cómo funciona ?

- Son 5 modos de juego para aprender/repasar los verbos irregulares
- Basta que elijas que el más se te acomode/guste
- En el juego se te preguntará por verbos en infinitivo, pasado, pasado participio y castellano

## Pruebalo en la WEB [LINK](https://osiries1111.github.io/juego_verbos_irregulares/)  
## Modo por consola (Python)

En este modo basta con ejecutar el archivo desde tu consola el archivo ``juego.py`` y comenzar a jugar
   
En ubuntu
```
python3 juego.py
```
En windows
```
python juego.py
```
### Cambiar cantidad de partidas

En ``juego.py`` cambia la variable ``cant_juegos`` por el número que desees, por defaut está en randint(1, 118)

### Cómo instalar Python

- Si no tienes instalado Python revisa este paso a paso -> https://kinsta.com/es/base-de-conocimiento/instalar-python/

- La versión utilizada de Python para este proyecto fue -> ``Python 3.10.12``


## Modo "interactivo" (html) si no tienes internet

En ese modo basta con activar el ``Live Server`` en ``VS Code`` y empezar a jugar

### Cambiar cantidad de partidas

En ``index.html`` cambia la variable ``totalPartidas`` por el número que desees, por defaut está en 10 (python), online lo puedes ajustar tu mismo

### No tengo Live Server
- Si no sabes cómo obtener ``Live Server`` te dejo un link tutorial: https://www.geeksforgeeks.org/installation-guide/how-to-enable-live-server-on-visual-studio-code/  

## Fuentes

- Se hizo uso de la siguiente página para obtener los verbos: https://blog.cambridge.es/listado-de-verbos-irregulares-en-ingles/
- Se utilizó IA para la realización de la versión online del juego

## Tecnologías utilizadas

- **HTML5, CSS3 y JavaScript "vanilla"** (sin frameworks ni librerías de por medio) para la versión web
- **[Google Fonts](https://fonts.google.com/)**: tipografías "Baloo 2" y "Quicksand"
- **Python 3** para el modo por consola
- `localStorage` para recordar la preferencia de modo oscuro/claro entre visitas

## Créditos de íconos y assets

- **Íconos de interfaz**: [Lucide](https://lucide.dev/) (licencia ISC) — usados en botones, menús y mensajes de resultado
- **Emoji ilustrados** (el conejito, la bombilla, las decoraciones flotantes de fondo, etc.): [Fluent Emoji de Microsoft](https://github.com/microsoft/fluentui-emoji) (licencia MIT) — se usan como imágenes en vez de emoji de texto para que se vean igual en cualquier dispositivo/sistema operativo
- **Sprites y arte del Modo Arcade** (personajes, terreno, fondo y obstáculos): pack ["Pixel Platformer" de Kenney](https://kenney.nl/assets/pixel-platformer) (licencia CC0 — de uso libre)
  
## Colaboración

Si deseas colaborar a mejorar este pequeño programa, eres bienvenido :D
