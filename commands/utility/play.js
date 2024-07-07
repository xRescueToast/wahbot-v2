const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { MessageEmbed, InteractionCollector, InteractionResponse, InteractionType, InteractionResponseType } = require('discord.js');
const { QueryType } = require ('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('plays a song :3')
		.addSubcommand(subcommand => 
			subcommand
				.setName('search')
				.setDescription('searches for a song ^-^')
				.addStringOption(option => option.setName('searchterms').setDescription('search keyword').setRequired(true))
			),
		//should be added better in later versions
		/*
		.addSubcommand(subcommand =>
			subcommand
				.setName("playlist")
				.setDescription("Plays a playlist from YT")
				.addStringOption(option => option.setName("url").setDescription("the playlist's url").setRequired(true))
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("song")
				.setDescription("Plays a single song from YT")
				.addStringOption(option => option.setName("url").setDescription("the song's url").setRequired(true))
		),
		*/
    async execute(client, interaction){
        // Make sure the user is inside a voice channel
		if (!interaction.member.voice) return interaction.reply("You need to be in a Voice Channel to play a song :(");

        // Create a play queue for the server
		const queue = await client.player.nodes.create(interaction.guild)

        // Wait until you are connected to the channel
		if (!queue.connection) await queue.connect(interaction.member.voice.channel)

		let embed = new EmbedBuilder()

        var song;
        //play song by url
		if (interaction.options.getSubcommand() === "song") {
            let url = interaction.options.getString("url")
            
            // Search for the song using the discord-player
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_VIDEO
            })

            // finish if no tracks were found
            if (result.tracks.length === 0)
                return interaction.reply("No results")

            // Add the track to the queue
            const song = result.tracks[0]
            await queue.addTrack(song)
            embed
                .setDescription(`**[${song.title}](${song.url})** has been added to the Queue`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duration: ${song.duration}`})

		}
        else if (interaction.options.getSubcommand() === "playlist") {

            // Search for the playlist using the discord-player
            let url = interaction.options.getString("url")
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_PLAYLIST
            })

            if (result.tracks.length === 0)
                return interaction.reply(`No playlists found with ${url}`)
            
            // Add the tracks to the queue
            const playlist = result.playlist
            await queue.addTracks(result.tracks)
            embed
                .setDescription(`**${result.tracks.length} songs from [${playlist.title}](${playlist.url})** have been added to the Queue`)
                .setThumbnail(playlist.thumbnail)

		} 

        //SEARCH FUNCTION
        else if (interaction.options.getSubcommand() === "search") {

            var final_song;

            // Search for the song using the discord-player
            let query = interaction.options.getString("searchterms")
            const result = await client.player.search(query, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_SEARCH
              });



              //console.log(result)
              //console.log(result.tracks)

              if (!result.hasTracks()) {
                const failedembed = new EmbedBuilder()
                embed.setTitle('No results found'),
                embed.setDescription(`No results found for \`${query}\``)
                return interaction.reply({embeds: [failedembed] })
              }
            

            // Add the track to the queue
            song = result.tracks[0]
            queue.addTrack(song.url)
            embed
                .setDescription(`**[${song.title}](${song.url})** has been added to the Queue`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duration: ${song.duration}`})
		}

        //play the song (surely this one works)
        //client.player.play(interaction.member.voice.channel, query)
        // Play the song
        //if (!queue.isPlaying) await queue.node.play()
        client.player.play(interaction.member.voice.channel, song)
        console.log(queue.node);
        
        
        // Respond with the embed containing information about the player
        await interaction.reply({
            embeds: [embed]
        })
	},
};