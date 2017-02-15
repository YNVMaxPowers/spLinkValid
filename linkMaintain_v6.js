var brokeURL = new Array();
function _EmailFactory() {
    return { Id: null, htmlText: null, subject: null };
}
function _LinkMantinFactory() {
    return {ListName:null,foundInvalid:null,sharepointVersion:null}
}
function UrlExists(myOBJ, url, ifBroken) {
    try {
        var http = new XMLHttpRequest();
        http.open('GET', url, true);

        http.onreadystatechange = function () {
            if (http.readyState != 4 && http.status == 200) {
                //  $("#results").append("<span>Validating.."+url+"</span></br>");
            } else if (http.readyState == 4 && http.status == 200) {
                // $("#results").append("<span>Found... "+ url +"</span><br/> ");
            } else if(http.readyState == 4 && http.status >= 400 && http.status <= 499) {
                ifBroken(myOBJ);
            }

        }


        http.send();
    } catch (err) {

    }
}
function testUrulExist() {
    UrlExists({}, "https://organization.ds.irsnet.gov/sites/Cyber/CyberServices/SitePages/publicContent/Fakeurl.html", function (u) {
        UrlExists({}, "https://organization.ds.irsnet.gov/sites/Cyber/CyberServices/SitePages/publicContent/Fakeurl.html", function () {
            alert("Test URL function working Fine");
        });
    });
}
function findURL(myText) {
    var expression = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

    var regex = new RegExp(expression);
    try {
        if (myText.indexOf("http") == 0) {
            var splitText = myText.split(',');
            for (var i = 0; i < splitText.length; i++) {
                if (i == 0) {
                    myText = encodeURI(splitText[i]);
                } else {
                    myText += " " + encodeURI(splitText[i]);
                }
            }
        }

        var anw = myText.match(regex);
        if (anw == null) {
            return [];
        } else {
            return anw;
        }
    } catch (err) {
        return [];
    }

}
function persistBrokeURl(objToFind) {
    var found = false;
    for (var i = 0; i < brokeURL.length; i++) {
        if (objToFind.Id == brokeURL[i].Id && objToFind.col.indexOf(brokeURL[i].col) != -1 && objToFind.InvalidUrl.indexOf(brokeURL[i].InvalidUrl) != -1) {
            found = true;
            break;
        }
    }
    if (found == false) {
        brokeURL.push(objToFind);
        return true;
    } else {
        return false;
    }
}
function getListDataValidateURLs(invalidURLObj) {
    $.getJSON(invalidURLObj.ListName, {}, function (data) {
        var modelArray = new Array();
        var objArrayToUse = null;
        if (invalidURLObj.sharepointVersion.indexOf("2010") > -1) {
            objArrayToUse = data.d.results
        } else {
            objArrayToUse = data.value;
        }

        for (var c = 0; c < objArrayToUse.length; c++) {
            var tempObj = objArrayToUse[c];
           

            for (var prop in tempObj) {
                var val = tempObj[prop];
                var urls = null;
                if (typeof val === 'string' || val instanceof String) {
		             val = val.replace("&#58;//", "://");
                    urls = findURL(val);
                    for (var i = 0; i < urls.length ; i++) {
                        UrlExists({ Id: tempObj.Id, col: prop, InvalidUrl: urls[i], Title: tempObj.Title }, urls[i], invalidURLObj.foundInvalid);
                    }
                } else {
                    if (val.hasOwnProperty('Url')) {
                        urls = findURL(val.Url);
                    }
                    if (urls != null) {
                        for (var i = 0; i < urls.length ; i++) {
                            UrlExists({ Id: tempObj.Id, col: prop, InvalidUrl: urls[i], Title: tempObj.Title }, urls[i], invalidURLObj.foundInvalid);
                        }
                    }
                }
                
            }

        }
        
    });
}
function getListInvalidUrls() {
    
    var myServicesObj = _LinkMantinFactory();
    myServicesObj.ListName = $("#listNameTb").val();

    myServicesObj.sharepointVersion = $('#sharepointVersion').find(":selected").val();;
    myServicesObj.ListName = buildURL(myServicesObj);
    
    myServicesObj.foundInvalid = function (obj) {
        if (persistBrokeURl({ Id: obj.Id, col: obj.col, InvalidUrl: obj.InvalidUrl, Title: obj.Title }) == true) {
            $("#results").append("<div> <b>Title:</b> " + obj.Title + " <b>Column:</b> " + obj.col + " <b>Invalid URL:</b>" + obj.InvalidUrl + "</div>");
        }
    }
    getListDataValidateURLs(myServicesObj);
}
function buildURL(servObj) {
    
        var listName = servObj.ListName;
        if (listName.length <= 0) { return false; }
        var myPage = window.location.href;
        var indexP = myPage.indexOf("SitePages");
        if (indexP == -1) {
            indexP = myPage.indexOf("SiteAssets");
        }
        myPage = myPage.substring(0, indexP);
    if (servObj.sharepointVersion.indexOf("2010") > -1) {
        myPage += "_vti_bin/ListData.svc/" + listName;
    } else {
        myPage += "_api/web/lists/getbytitle('"+listName+"')/items"
    }
    return myPage;
}

function getListInvalidServicesUrls() {
        
    var myServicesObj = _LinkMantinFactory();
    myServicesObj.ListName = "Services";
    myServicesObj.sharepointVersion = $('#sharepointVersion').find(":selected").val();
    myServicesObj.ListName = buildURL(myServicesObj);
    
    myServicesObj.foundInvalid = function (obj) {
        if (persistBrokeURl({ Id: obj.Id, col: obj.col, InvalidUrl: obj.InvalidUrl, Title: obj.Title }) == true) {
            $("#results").append("<div> <b>Title:</b> " + obj.Title + " <b>Column:</b> " + obj.col + " <b>Invalid URL:</b>" + obj.InvalidUrl + "</div>");
        }
    }
    
    getListDataValidateURLs(myServicesObj);
}

function SendEmail3(Subject, To, htmlBody) {
    try {
        var outlookApp = new ActiveXObject("Outlook.Application");
        var nameSpace = outlookApp.getNameSpace("MAPI");
        mailFolder = nameSpace.getDefaultFolder(6);
        mailItem = mailFolder.Items.add('IPM.Note.FormA');
        mailItem.Subject = Subject;
        mailItem.To = To;
        mailItem.HTMLBody = htmlBody;
        mailItem.display(0);
    } catch (err) {
    }
    return true;
}
function requestUpdatesAll() {
    var emailArray = new Array();

    for (var i = 0; i < brokeURL.length; i++) {
        var consider = brokeURL[i];
        var found = false;
        var emailIndex = 0;
        while (found == false && emailIndex < emailArray.length) {
            if (emailArray[emailIndex].Id == consider.Id) {
                found = true;
                break;
            } else {
                emailIndex++;
            }
        }
        if (found == true) {
            emailArray[emailIndex].htmlText += "<br/><span>Column: " + consider.col + " Invalid URL: " + consider.InvalidUrl + "</span>";
        } else {
            var emailOBJ = _EmailFactory();
            emailOBJ.htmlText = "<p>During Cyber Service Catalog upkeep for  we found a  invalid link(s) for <b>" + consider.Title + "</b> </p>" +
                                                                                            "<br/><span>     - <b>Column: </b>" + consider.col + "<b> Invalid URL :</b> " + consider.InvalidUrl + "</span>";
            emailOBJ.subject = "Invalid Cyber Service Catalog URL(s) for " + consider.Title;
            emailOBJ.Id = consider.Id;
            emailArray.push(emailOBJ);

        }
    }
    for (var ind = 0; ind < emailArray.length; ind++) {
        emailArray[ind].htmlText += "</br><p>Please reply back to the sender with corrected URLs </p><br/><span>Thanks</span>"
        SendEmail3(emailArray[ind].subject, "", emailArray[ind].htmlText);
    }
}
$(document).ready(function () {
    //$("#validateListURLs").button();
    $("#validateListURLs").click(function () {
        getListInvalidUrls();
    });
    //$("#TestURL").button();
    $("#TestURL").click(function () {
        testUrulExist();
    });
    //$("#sendUpdateEmail").button();
    $("#sendUpdateEmail").click(function () {
        if (brokeURL.length == 0) {
            alert("You Validate a lists URL's first either by pressin the Check Cyber list or typing in a list name and pressing Check Arbitrary");
        } else {
            requestUpdatesAll();
        }

    });
    $("#arb").click(function () {
        $("#listNameCtn").show();
    });
    $("#checkServices").click(function () {
        getListInvalidServicesUrls();
    });
    $("#listNameCtn").hide();
})
