let tags = htmlContent.match(/<\w+.*?>/g) || [];
let parsedHtml = {};
tags.forEach(tag => {
  let tagName = tag.match(/<\w+/)[0].slice(1);
  let content = htmlContent.split(tag)[1].split(new RegExp('</' + tagName + '>'))[0];
  parsedHtml[tagName] = content;
});
return parsedHtml;