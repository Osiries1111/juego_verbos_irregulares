from random import randint

lista_verbos = []
with open("verbos.csv", "r", encoding="latin-1") as archivo:
    for linea in archivo:
        line = linea.strip().split(",")
        lista_verbos.append(line)

if len(lista_verbos) < 2:
    print("El archivo verbos.csv no tiene suficientes líneas.")
    exit()

cant_juegos = randint(1, 118)

count = 0
print(f"Es hora del super concurso de verbos irregulares\nNúmero de partidas: {cant_juegos}\n")

for i in range(cant_juegos):
    linea_aleatoria = randint(1, len(lista_verbos) - 1)
    columna_aleatoria_1 = randint(0, 3)
    columna_aleatoria_2 = randint(0, 3)

    while columna_aleatoria_1 == columna_aleatoria_2:
        columna_aleatoria_2 = randint(0, 2)

    pregunta = f"{lista_verbos[0][columna_aleatoria_1]}: {lista_verbos[linea_aleatoria][columna_aleatoria_1]} -> {lista_verbos[0][columna_aleatoria_2]}: "
    respuesta = input(pregunta)

    if respuesta.strip().lower() != lista_verbos[linea_aleatoria][columna_aleatoria_2].strip().lower():
        print(f"La respuesta correcta es: {lista_verbos[linea_aleatoria][columna_aleatoria_2]}\n")
    else:
        count += 1
        print("Bien hecho :)\n")

if count == cant_juegos:
    print("Los acertaste todos!!!! Ganasteee SOS UN PRO")
else:
    print(f"Sigue intentandolo :') {count}/{cant_juegos}")