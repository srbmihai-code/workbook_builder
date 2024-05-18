# Workbook Buidler

## Cum este si cum functioneaza?

Workbook Builder este o platforma educationala in care profesorii pot creea culegeri interactive si elevii le pot accesa.
Profesorii pot incarca exercitii cu rezolvarile lor, in format pdf sau imagine, iar aplicatia va face automat asocierea intre fiecare exercitiu si rezolvarea lui.
Astfel, daca un elev se blocheaza la un exercitiu, poate cere un indiciu si o linie din rezolvare va aparea

### Cum se creeaza o culegere?

Profesorul trebuie sa introduca titlu culegerii si sa incarce fisierele culegerii. Se pot creea mai multe capitole. Culegerile pot fi private, adica pot fi descarcate de elevi cu parola, sau publice.
![image](https://github.com/srbmihai-code/workbook_builder/assets/154465191/7eabed3d-781f-4477-977b-38d6f2babd28)

### Cum se descarca o culegere?

Elevul trebiue doar sa introduca numele, autorul si parola, si ea se va adauga. Daca e publica, trebuie doar sa dea pe butonul "Descarca".
O data descarcate, culegerile vor putea fi accesate si offline.

![image](https://github.com/srbmihai-code/workbook_builder/assets/154465191/3256ec99-409f-4f2a-90c7-e368a49c3214)


### Cum interactioneaza un elev cu culegerea?

Mai intai, selecteaza capitolul si exercitiile se pot afisa.

![image](https://github.com/srbmihai-code/workbook_builder/assets/154465191/409d70a4-9727-499c-afe7-5033bc5ced9a)

Apoi, daca se blocheaza la un exercitiu, poate apasa pe butonul "Indiciu" si o linie din rezolvare va aparea.

![image](https://github.com/srbmihai-code/workbook_builder/assets/154465191/a4900645-ff59-4937-9bc7-d2125fe871f0)

Daca a rezolvat un exercitiu, il poate marca ca "Rezolvat" si bara de progres va reflecta acest lucru.

## Tehnologii folosite

[![Tehnologii folosite](https://skillicons.dev/icons?i=electron,html,css,js,python,flask)](https://skillicons.dev)

Pentru aplicatie am folosit Electron cu limbajele HTML CSS si Javascript. Pentru server am folosit limbajul Python cu libraria Flask. De asemenea, am folosit Tesseract, o librarie care se ocupa de OCR, pentru a scana fisierele.

## Sreenshot-uri

Meniul pentru elev

![image](https://github.com/srbmihai-code/workbook_builder/assets/154465191/4abed1f7-ed0e-496b-8bbd-0ebf1b4a262a)

Meniul pentru profesor

![image](https://github.com/srbmihai-code/workbook_builder/assets/154465191/8594409b-fe67-4309-b0d7-47c1f8bb7f74)



## Instalare

### Aplicatie Desktop
Pentru a instala, puteti descarca codul si compila
```console
$ git clone https://github.com/srbmihai-code/workbook_builder.git
$ cd app
$ npm install
```
Sau puteti descarca direct un fisier exe de Windows de pe pagina [releases](https://github.com/srbmihai-code/workbook_builder/releases)

### Server
Pentru a rula server-ul, descarcati codul si descarcati pachetele necesare. De asemenea trebuiesc descarcate Tesseract (se ocupa cu scanarea) si Poppler (se ocupa cu transformarea fisierelor pdf in imagini).
```console
$ git clone https://github.com/srbmihai-code/workbook_builder.git
$ cd server
$ pip install -r requirements.txt
$ python
> from main import db, app
> app.app_context().push()
> db.create_all()
$ waitress-serve --host 0.0.0.0 main:app
```
Daca vreti sa testati cum functioneaza o culegere, puteti descarca culegerea "Probleme de matematică pentru clasa a IX-a  -olimpiadă și concursuri" – de Enache Pătrașcu de pe pagina [releases](https://github.com/srbmihai-code/workbook_builder/releases). Trebuie sa puneti cele 2 foldere in folderul cu serverul si ea va putea fi accesata.

### Approval app
Pentru a pastra securitatea aplicatiei, in server este o lista cu utilizatorii care pot incarca culegeri publice.
Pentru a da acces unui utilizator, descarcati codul si rulati urmatoarea comanda:
```console
$ git clone https://github.com/srbmihai-code/workbook_builder.git
$ cd approval_app
$ pip install -r requirements.txt
$ python main.py username
```
Pentru a asigura ca doar persoanele autorizate pot face acest lucru, atat in folderul server cat si in approval_app trebuie sa fie un fisier .env in care sa se specifice o cheie
```
SECRET_KEY = "cheie"
```
