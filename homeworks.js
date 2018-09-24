function getStudents() {
    return [
        "csmcclure"
    ];
}

function getStudentNames() {
    return [
        "C. McClure"
    ];
}

function getNumProjects() {
    return 3;
}

function getProjectUrls() {
    return [
        "homework1.html",
        "homework2.html",
        "homework3.html",
        "homework4.html",
        "homework5.html",
        "homework6.html",
        "homework7.html",
        "homework8.html",
        "homework9.html",
    ];
}

function getProjectDescs() {
    return [
        "WebGL \"Hello, World\"",
        "User Input",
        "2D Graphics",
        "3D Model Turntable",
        "3D Transformations",
        "Scene graphs",
        "Collision Detection",
        "PBR NPR",
        "Game / Demoscene Compo"
    ];
}

function getName(i) {
    let projects = [
        "WebGL \"Hello, World\"",
        "User Input",
        "2D Graphics",
        "3D Model Turntable",
        "3D Transformations",
        "Scene graphs",
        "Collision Detection",
        "PBR NPR",
        "Game / Demoscene Compo"
    ];
    if (i >= 0 && i < projects.length) {
        return projects[i];
    }
}

function writeIndex() {
    let projects = [
        "WebGL \"Hello, World\"",
        "User Input",
        "2D Graphics",
        "3D Model Turntable",
        "3D Transformations",
        "Scene graphs",
        "Collision Detection",
        "PBR NPR",
        "Game / Demoscene Compo"
    ];
    let prefixes = [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
    ];
    let style = "style=\"vertical-align: middle; text-align: center;\"";

    document.write("<center><table><tr><th>No.</th><th>Preview</th><th>Description</th></tr>");
    for (let i = 0; i < projects.length; i++) {
        let a1 = "<a href=\"" + prefixes[i] + "-homework" + i + ".html\">"
        document.write("<tr>");
        document.write("<td " + style + ">" + i.toString() + "</td>");
        document.write("<td " + style + ">" + a1 + "<img src=\"" + prefixes[i] + "-homework" + i +
            "-thumbnail.png\" /></a></td>");
        document.write("<td>" + a1 + projects[i] + "</a></td>");
        document.write("</tr>");
    }
    document.write("<tr></table></center>");
}


function writeTitle(pageTitle, pageAuthor) {
    document.write("<title>" + pageTitle);
    if (pageAuthor.length)
        document.write(" (" + pageAuthor + ")");
    document.write("</title>");
}

function writeHeader(pageTitle, pageAuthor) {
    document.write("<a href='index.html'>" + pageTitle);
    if (pageAuthor.length)
        document.write(" (" + pageAuthor + ")");
    document.write("</a>");
}

function getClassName() {
    return "CS 480/680";
}

function getSemester() {
    return "Fall 2018";
}

function getClassDescription() {
    return "Learn the fundamentals of computer graphics including vector and matrix mathematics, 2D and 3D primitives, rendering algorithms, and application design.";
}