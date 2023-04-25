const cheerio = require("cheerio");
const axios = require("axios");
const j2cp = require("json2csv").Parser;
const fs = require("fs");
const parser = new j2cp();

const matchList = [];

const teamIdList = [
  {
    teamName: "India",
    teamId: 6,
  },
  {
    teamName: "England",
    teamId: 1,
  },
  {
    teamName: "Australia",
    teamId: 2,
  },
  {
    teamName: "New Zealand",
    teamId: 5,
  },
  {
    teamName: "Pakistan",
    teamId: 7,
  },
  {
    teamName: "South Africa",
    teamId: 3,
  },
  {
    teamName: "Bangladesh",
    teamId: 25,
  },
  {
    teamName: "Sri Lanka",
    teamId: 8,
  },
  {
    teamName: "Afghanistan",
    teamId: 40,
  },
  {
    teamName: "West Indies",
    teamId: 4,
  },
  {
    teamName: "Ireland",
    teamId: 29,
  },
  {
    teamName: "Scotland",
    teamId: 30,
  },
  {
    teamName: "Zimbabwe",
    teamId: 9,
  },
  {
    teamName: "Netherlands",
    teamId: 15,
  },
  {
    teamName: "Oman",
    teamId: 37,
  },
  {
    teamName: "Namibia",
    teamId: 28,
  },
  {
    teamName: "United Arab Emirates",
    teamId: 27,
  },
  {
    teamName: "United States",
    teamId: 11,
  },
  {
    teamName: "Nepal",
    teamId: 33,
  },
  {
    teamName: "Papua New Guinea",
    teamId: 20,
  },
];

const country = teamIdList[0];

(async function () {
  for (let year = 2023; year >= 2010; year--) {
    if (year == 2023) {
      await setTimeout(() => {
        yearlyList(country.teamId, country.teamName, year, matchList);
      }, 10000);
    } else {
      await yearlyList(country.teamId, country.teamName, year, matchList);
      flag = 1;
    }
  }
  // await fs.writeFileSync(`./${teamName}.csv`, parser.parse(matchList));
})();

async function yearlyList(teamId, teamName, year, matchList) {
  const baseURL = `https://stats.espncricinfo.com/ci/engine/records/team/match_results.html?class=2;id=${year};team=${teamId};type=year`;

  // other details
  async function otherDetails(URL, obj) {
    try {
      const response = await axios.get(URL);
      const $ = cheerio.load(response.data);

      // match details tables
      const tables = $(".ds-table");
      tables.each((index, element) => {
        switch (index) {
          case 0:
            let aLLText = $(element).find(".ds-underline");
            aLLText.each((index, element) => {
              let text = $(element).text();
              if (text.indexOf("(c)") > 0) {
                let captain = text.split("(c)");
                obj.nameOfCaptain = captain[0].trim();
                console.log(obj.nameOfCaptain);
              }
            });
            break;
          case 2:
            let aLLText2 = $(element).find(".ds-underline");
            aLLText2.each((index, element) => {
              let text = $(element).text();
              if (text.indexOf("(c)") > 0) {
                let captain = text.split("(c)");
                obj.nameOfOppCaptain = captain[0].trim();
                console.log(obj.nameOfOppCaptain);
              }
            });
            break;
          case 4:
            let aLLText3 = $(element).find("td span");
            aLLText3.each((index, element) => {
              if (index == 0) {
                obj.nameOfStadium = $(element).text();
              } else if (index == 2) {
                let toss = $(element).text().split(",");
                if (teamName == toss[0]) {
                  obj.tossResult = 1;
                  if (toss[1].split(" ")[3] != "bat") {
                    let temp = obj.nameOfCaptain;
                    obj.nameOfCaptain = obj.nameOfOppCaptain;
                    obj.nameOfOppCaptain = temp;
                  }
                } else {
                  obj.tossResult = 0;
                  if (toss[1].split(" ")[3] == "bat") {
                    let temp = obj.nameOfCaptain;
                    obj.nameOfCaptain = obj.nameOfOppCaptain;
                    obj.nameOfOppCaptain = temp;
                  }
                }
              }
            });
            break;
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  // ********************** get data start ***************** //
  async function getData(URL) {
    try {
      const response = await axios.get(URL);
      const $ = cheerio.load(response.data);

      const matchData = $(".data1");

      // loop (matchData)
      matchData.each(async (index, element) => {
        let hostCountry,
          opponentCountry,
          odiMatchDate,
          matchURL,
          nameOfStadium,
          matchResult,
          tossResult,
          nameOfCaptain,
          nameOfOppCaptain;

        const list = $(element).children("td");
        // loop each data
        await list.each((index, element) => {
          switch (index) {
            case 0:
              hostCountry = $(element).children("a").text();
              if (hostCountry != teamName) {
                opponentCountry = hostCountry;
              }
              break;
            case 1:
              let country2 = $(element).children("a").text();
              if (country2 != teamName) {
                opponentCountry = country2;
              }
              break;
            case 2:
              let winner = $(element).children("a").text();
              if (winner == teamName) {
                matchResult = 1;
              } else if (winner == opponentCountry) {
                matchResult = 0;
              } else {
                matchResult = "-";
              }
            case 5:
              odiMatchDate = $(element).text();
              break;
            case 6:
              matchURL = `https://stats.espncricinfo.com${$(element)
                .children("a")
                .attr("href")}`;
              break;
          }
        });
        // loop each data end //
        let detailObj = {
          odiMatchDate,
          tossResult,
          nameOfCaptain,
          hostCountry,
          nameOfStadium,
          opponentCountry,
          nameOfOppCaptain,
          matchResult,
        };
        await otherDetails(matchURL, detailObj);

        await matchList.push(detailObj);
        await console.log(matchList, matchList.length);
        await fs.writeFileSync(
          `./info/${teamName}.csv`,
          parser.parse(matchList)
        );
      });
      // loop (matchData) end //
    } catch (error) {
      console.error(error);
    }
  }
  // ********************** get data end ***************** //
  await getData(baseURL);
}
