import pkg from 'stream-chat';
const { StreamChat } = pkg;
import express from 'express';
import channel from 'stream-chat';
import create from 'stream-chat';

// Express Server and Chat App
const PORT = 1799;
const server = express();
const app_key = 'app key';
const secret = 'API secret'
const chatClient = new StreamChat(app_key, secret);

// Confirm Server is up
server.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
 });

// Endpoint Example: given a userID, return a signed JWT for the chat application
server.post("/token", async (req, res) => {
  const user_id  = req.body;
  try {
    const token = await chatClient.createToken("" + user_id);
    res.status(200).json({
      payload: token,
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});


// Endpoint Add Members To Channel: given a channel ID and an array of users, add them as members to a new channel
// Takes in an array of users as members via the header "users" from the request payload and creates a new channel with these members
// Still needs to check if channel a already exists, so as to avoid creating a new one if unneccessary

server.post("/addMembersToChannel", async (req, res) => {
  // Separate names into a new array free of any white space so they work as IDs
  const newChannelMembers = req.headers.users.replace(/\s/g, "").split(',');
  // Go through the array of all user names and create these users to ensure they are present in the system
  const arrayLength = newChannelMembers.length;
  for (var i = 0; i < arrayLength; i++) {
      await chatClient.upsertUser({ id: "" + newChannelMembers[i] });
  }

  // Create a channel with these members
  try {
      const conv = chatClient.channel('messaging', req.headers.channel_id, {
          name: req.headers.channel_id  ,
          image: 'http://bit.ly/2O35mws',
          members: newChannelMembers,
          created_by_id: req.headers.user_id
      });
      await conv.create();
    res.status(200).json({
      // Payload confirmation that channel was created with the intended members
      payload: ("Channel_ID: "+ conv.data.name + ". Table Includes: " + [conv._data.members] + ". User ID: " + req.headers.user_id)
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});


// Endpoint Delete User: delete the user from the app and hard delete their messages
// Takes header "user_id" from payload. User must be in the system already. Endpoint below this one creates a user if needed for testing.

server.post("/deleteuser", async (req, res) => {
  try {
  // Grab user data from payload 
  const user_id = req.headers.user_id
  // Delete the User
  const destroy = await chatClient.deleteUser(user_id, {
    // Hard delete all messages set to True
    mark_messages_deleted: true,
    });
    res.status(200).json({
      payload: ("Deleted: " + req.headers.user_id)
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400).json({
      payload: "Could not delete: " + req.headers.user_id
    });
  }
});

// Create a user for testing Endpoint above
server.post("/createuser", async (req, res) => {
  try {
  const name = "" + req.headers.user_id
  const userOne = await chatClient.upsertUser({ id: name });
    res.status(200).json({
      payload: ("Created User: " + name)
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(400).json({
      payload: "did not create user"
    });
  }
});


// // Endpoint Return All Messages: given a channel and a keyword, return all of the messages with the keyword in the message content. 
// // In progress. Would solve this with same format as the endpoints above and below code approximations. Have more to learn about messages.
// // server.post("/returnchannelmessages", async (req, res) => {
//     try {
//     const channel = "" + req.headers.channel
//     const keyword = "" + req.headers.keyword
//     // Find channel, find messages with key word and add to an array, return array in payload
//       const messages = chatClient.getAllMessages(channel, keyword)
//       res.status(200).json({
//         payload: messages
//       });
//     } catch (error) {
//       console.log(error);
//       res.sendStatus(400);
//     }
//   });


// // Endpoint Return Channel members: given a userID and a channel type return channel members
// // In progress. Unclear as to if this is enough data to find a desired channel. Seems there could be multiple channels with the same user and type. Would be open to learning more on this topic.
// server.post("/findchannelmembers", async (req, res) => {
//     const userID = req.headers.user_id
//     const channelType = req.headers.channel_type
//     try {
//       // Find channel
//       const channelFilter = { type: 'messaging', members: { $in: [userID] } 
//       // Potentially filter for correct channel
//       // Create a variable to hold the members in the channel
//       const members = channelFilter.members
//     res.status(200).json({
//       // Payload returns with all members listed
//     payload: members
//       });
//     } catch (error) {
//       console.log(error);
//       res.sendStatus(400);
//     }
//   });

