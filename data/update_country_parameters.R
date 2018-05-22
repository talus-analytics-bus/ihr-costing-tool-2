#########################################################################
## Setup (may need to change code here) #################################
#########################################################################

## what year do you want to update the file country_specific_parameters.json
## with population projections from?
year <- 2018

## what type of population projections do you want to use?
## BY DEFAULT USE MEDIUM: MOST FREQUENTLY CITED AND RECOMMENDED BY UN FOR GENERAL PURPOSE
## from UN website "medium variant: most used"
projection_type <- "Medium"

## set working directory
## if you're not Steph, you may need to change this to the location of the data/
## subdirectory of IHR-costing-tool-2 on your machine, if you're not storing
## ihr-costing-tool-2 directly in your documents folder
setwd("~/Documents/ihr-costing-tool-2/data")

## define a function to save JSON data
## just run this code to define the function
write_json <- function(df, path, df_type = "rows", raw_type = "mongo"){
  require(readr)
  require(jsonlite)
  require(dplyr)
  df %>% 
    toJSON(dataframe = df_type, raw = raw_type) %>%
    write_lines(path)
  df
}

## load library jsonlite
## if you haven't already installed this, install the package by running the commented out
## install.packages code below
## install.packages("jsonlite")
## install.packages("readr")
## install.packages("dplyr")
library(jsonlite)
library(readr)
library(dplyr)

#########################################################################
## load data ############################################################
#########################################################################

## load world population data
## data obtained from https://esa.un.org/unpd/wpp/Download/Standard/CSV/
## note: these data must be in the working director you specified above
## important: population counts by thousands: "PopTotal: Total population, both sexes (thousands)"
dat <- read.csv("WPP2017_TotalPopulationBySex.csv")

## load json of country specific parameters
## note: these data must be in the working director you specified above
js <- fromJSON("country_specific_parameters.json")

#########################################################################
## process country-level population data from UN ########################
#########################################################################

## pull population data for the year specified above using the projection method specified
## pull only the columns Location (country) and PopTotal (total population)
pop_updates <- dat[which(dat$Variant == projection_type & dat$Time == year),
                   which(names(dat) %in% c("Location", "PopTotal"))]

## multiply PopTotal by 1,000 since estimates are in the 1,000s
## rename it another field name so you don't accidentally run this line repeatedly
pop_updates$PopTotal_actual <- pop_updates$PopTotal* 1000

## just take the two fields we actually want
pop_updates <- pop_updates[,which(names(pop_updates) %in% c("Location", "PopTotal_actual"))]

## rename fields of data.frame pop_updates
names(pop_updates) <- c("name", "updated_multipliers.population")

pop_updates$name <- as.character(pop_updates$name)

## update names to ensure that country names match between sources
pop_updates[which(pop_updates$name == "Viet Nam"),]$name <- "Vietnam"
pop_updates[which(pop_updates$name == "Bolivia (Plurinational State of)"),]$name <- "Bolivia"
pop_updates[which(pop_updates$name == "Brunei Darussalam"),]$name <- "Brunei"
pop_updates[which(pop_updates$name == "Cabo Verde"),]$name <- "Cape Verde"
pop_updates[which(pop_updates$name == "Democratic Republic of the Congo"),]$name <- "Congo, The Democratic Republic of the"
pop_updates[which(pop_updates$name == "Czechia"),]$name <- "Czech Republic"
pop_updates[which(pop_updates$name == "Timor-Leste"),]$name <- "East Timor"
pop_updates[which(pop_updates$name == "Faeroe Islands"),]$name <- "Faroe Islands"
pop_updates[which(pop_updates$name == "Fiji"),]$name <- "Fiji Islands"
pop_updates[which(pop_updates$name == "China, Hong Kong SAR"),]$name <- "Hong Kong"
pop_updates[which(pop_updates$name == "Iran (Islamic Republic of)"),]$name <- "Iran"
pop_updates[which(pop_updates$name == "Côte d'Ivoire"),]$name <- "Ivory Coast"
pop_updates[which(pop_updates$name == "Kazakhstan"),]$name <- "Kazakstan"
pop_updates[which(pop_updates$name == "Lao People's Democratic Republic"),]$name <- "Laos"
pop_updates[which(pop_updates$name == "Libya"),]$name <- "Libyan Arab Jamahiriya"
pop_updates[which(pop_updates$name == "China, Macao SAR"),]$name <- "Macao"
pop_updates[which(pop_updates$name == "TFYR Macedonia"),]$name <- "Macedonia"
pop_updates[which(pop_updates$name == "Micronesia (Fed. States of)"),]$name <- "Micronesia, Federated States of"
pop_updates[which(pop_updates$name == "Republic of Moldova"),]$name <- "Moldova"
pop_updates[which(pop_updates$name == "Dem. People's Republic of Korea"),]$name <- "North Korea"
pop_updates[which(pop_updates$name == "State of Palestine"),]$name <- "Palestine"
pop_updates[which(pop_updates$name == "Réunion"),]$name <- "Reunion"
pop_updates[which(pop_updates$name == "Republic of Korea"),]$name <- "South Korea"
pop_updates[which(pop_updates$name == "Syrian Arab Republic"),]$name <- "Syria"
pop_updates[which(pop_updates$name == "China, Taiwan Province of China"),]$name <- "Taiwan"
pop_updates[which(pop_updates$name == "United Republic of Tanzania"),]$name <- "Tanzania"
pop_updates[which(pop_updates$name == "Venezuela (Bolivarian Republic of)"),]$name <- "Venezuela"
pop_updates[which(pop_updates$name == "British Virgin Islands"),]$name <- "Virgin Islands, British"
pop_updates[which(pop_updates$name == "United States Virgin Islands"),]$name <- "Virgin Islands, U.S."
pop_updates[which(pop_updates$name == "Wallis and Futuna Islands"),]$name <- "Wallis and Futuna"

#########################################################################
## update json population data with specified year ######################
#########################################################################

## merge the original js (unupdated file country_specific_parameters.json)
## with population in pop_updates, which contains population estimates
## for the year specified and with the projection type specified (should be projection type medium by default)
updated_dat <- merge(js, pop_updates, by = "name", all.x = TRUE)

## are there any countries for whic population data are missing?
print("Any countries with missing population data?")
any(updated_dat[which(is.na(updated_dat$updated_multipliers.population)),]$name)

## rename Libya
updated_dat$name[which(updated_dat$name == "Libyan Arab Jamahiriya")] <- "Libya"

## replace current population estimates with new population estimates
updated_dat$multipliers["population"] <- updated_dat$updated_multipliers.population

## remove additional file ("updated_multipliers.pouplation)
updated_dat <- updated_dat[,-which(names(updated_dat) == "updated_multipliers.population")]

#########################################################################
## save new json data with updated populations ##########################
#########################################################################

write_json(updated_dat, path = "country_specific_parameters2018.json")
