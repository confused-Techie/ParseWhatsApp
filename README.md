# ParseWhatsApp

This is a very quick CLI application created to parse WhatsApp exported conversations, and glean data about them, leaving them in an organized JSON format that then can be used further on if you'd like.

If you have any issues, or would like any improvements feel free to create an issue or contact me otherwise via email `dev@lhbasics.com`.

## Prerequisites

Through some research it seems that over time WhatsApp exported conversations can change slightly, so I will define the format I used to build this here.

```` (Example)
5/27/21, 7:28 PM - Messages and calls are end-to-end encrypted.
5/27/21, 7:28 PM - confusedTechie: Hello
5/27/21, 7:29 PM - Linus 💜: Hi!
````

Following this, you want to ensure that your exported data follows this format.

````(Format)
DD/MM/YY, HH:MM PM - sender: message
````

Now if you glance through your conversation history and it follows this format then you are good to run the application.

The only exceptions that this application will handle, is a long continued message that spans two lines.

````
DD/MM/YY, HH:MM PM - sender: This is a very long text message, that was sent
and moved to two lines when exporting from WhatsApp
````

Additionally this will handle system messages with no issue.

````
DD/MM/YY, HH:MM PM - This is a system message. It lists no sender since it comes from WhatsApp.
````

## Usage

### Setup

To setup all thats needed is to download the source code, or clone the repo locally.

Additionally you will need to install NPM on your system if you don't already have it.

Then place your exported WhatsApp conversation into the same folder or a near by folder.

Then you need to create your config file.

### Configuration

The configuration file is necessary for ParseWhatsApp to function. There is an example configuration file in this repo titled [config_example.json](https://github.com/confused-Techie/ParseWhatsApp/blob/main/config_example.json).

Further details are available below.

### Run

Then finally to run the application just type the following in the same folder.

````
npm run parse
````

## Output

This will output two files, the Summary Output, and the Full Output.

The Summary will contain the built in Summary features and whatever you define in your `config.json` file.

The Full Output will contain your entire conversation as JSON for easy consumption later on. If needed.

## Configuration Options

Refer to [config_example.json](https://github.com/confused-Techie/ParseWhatsApp/blob/main/config_example.json) for any clarification needed.

| Option | Value | Note |
| --- | --- | --- |
| input | Reference to a path to your chat.txt | This should be relative to where you've cloned the repo. |
| output | Relative Path to where you want the output stored. | Keep in mind this should include the file title, and extension of `.json` |
| summary_output | Relative Path for the Summary Output File. | Again with the file name and `.json` at the end |
| users | An array of User Objects | This is a list of every users present in your WhatsApp Chat Export. |
| users.[].name | The exact name of the User as it shows in the WhatsApp Chat export. | This needs to match exactly, including any capitalization or emojis. |
| users.[].reference | This is a simple text reference to the above user. | Should be simplified, using only standard letters, removing any spaces or emojis present in their usual name. |
| specials | Array of Special Objects. | Specials are used to match against messages and grab any additional stats you need. |
| specials.[].title | A simple one word title to attribute to this kind of match. | Should be something for you to easily refer to later |
| specials.[].match | A Regex method to use to match the type of message you need. This should exclude any Regex Flags as those are applied later on. |

### Specials

The specials are used to gather additional stats about the messages in your conversation.

Lets say for example I want to find every time the word Shark was mentioned in my conversation.

I would need to think of the Regex to match this word.

So lets say I want to match the words `shark`, `sharks`, `sharkboy`, and `sharknado` to cover my bases.

I could use very simple Alternate Meta Sequence `|`.

Now again in our Regex here we don't need to specify any Flags, but it does have to be ECMAScript compliant.

So our Regex could look like this.

`/shark|sharks|sharkboy|sharknado/gi` In ECMAScript.

But we don't need any flags, and this is passed through the RegExp Object in Java, so we don't need any delimiters. Which leaves use with:

`shark|sharks|sharkboy|sharknado`

The `g` and `i` Flags are applied automatically. Meaning it will match Globally, and case insensitive.

From here we just need to find a safe, understandable name for it. Which we can just call `shark`.

All of this leaves a config like so:

````
"specials": [
  {
    "title": "shark",
    "match": "shark|sharks|sharkboy|sharknado"
  }
]
````

Which once run will leave a new stat in you Output Summary File per users.

````
{
  "user1": {
    "shark": 10
  },
  {
    "user2": {
      "shark": 0
    }
  }
}
````

With the value being how many individual times Shark was mentioned.

## Output Files

### Output Summary

The output summary will contain objects of each User specified in your `users` array. Referenced by the reference name you specified. Then within their object will be the stats of the types of messages they sent. Some built in and whatever you specified in the `specials` section. Followed by a number referencing the amount of times this was included with a message.

* total: The total amount of messages they sent in the chat export.
* picturesSent: This is the amount of Picutres they sent in the chat, reference by the value `<Media omitted>` as their message content.
* biggestDay: Is an object to reference what day they sent the most messages.
* biggestDay.day: Is a reference to the day the most images were sent, it will be stored in the exact same format as your source chat export.
* biggestDay.many: Is the amount of messages they sent that day.

### Output Full

The full output file, will have to major objects.

* senders: Which will mirror the Output Summary file
* contents: Which is a fully parsed JSON format of all messages in your chat export.

The format of contents is below:

* date: This is the date the message was sent in the same format as your source chat export.
* time: The time the message was sent.
* nightDay: An indication of weather or not the image was sent during the night or the day. Valid Values are: `AM` or `PM`
* sender: The sender of the specific message. This will match the sender in your chat export. Or will be the built in type `system`
* msg: This is the contents of the message. Any messages that expand two lines will be merged into its parent message. If the message was a picture or other media that resulted in `<Media omitted>` as the message content, it will NOT be included in this Output Full File.
